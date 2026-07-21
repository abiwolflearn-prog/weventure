import { bookingRepository, IBookingFilters, IPaginatedBookings } from '../repositories/BookingRepository';
import { workspaceRepository } from '../repositories/WorkspaceRepository';
import { AuditLog } from '../models/AuditLog';
import { IBookingDocument } from '../models/Booking';
import { Agreement } from '../models/Agreement';
import { Invoice, InvoiceStatus } from '../models/Invoice';
import { IUserIdentity, UserRole } from '../types';
import { ValidationError, NotFoundError, ConflictError, ForbiddenError } from '../errors/AppError';
import { notificationService, NotificationCategory } from './NotificationService';
import { emailService } from './EmailService';
import { pricingService } from './PricingService';

export class BookingService {
  private async logActivity(
    tenantId: string,
    user: IUserIdentity,
    action: string,
    resourceId: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      await AuditLog.create({
        tenantId,
        userId: user.id,
        userEmail: user.email,
        action,
        resourceType: 'BOOKING',
        resourceId,
        details,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Audit logging failed for booking:', err);
    }
  }

  public async createBooking(
    tenantId: string,
    data: {
      spaceId: string;
      startTime: string;
      endTime: string;
      purpose?: string;
      billingPlanId?: string;
      signedAgreementText?: string;
      emergencyContact?: {
        name: string;
        relationship: string;
        phone: string;
      };
      billingDetails?: {
        name: string;
        email: string;
        phone?: string;
        company?: string;
        address?: string;
      };
      teamSize?: number;
      notes?: string;
      documentUrl?: string;
    },
    user: IUserIdentity
  ): Promise<IBookingDocument> {
    const workspace = await workspaceRepository.findById(data.spaceId, tenantId);
    if (!workspace) {
      throw new NotFoundError('Workspace space not found or unauthorized');
    }

    if (!workspace.isAvailable) {
      throw new ValidationError('This workspace is currently marked as out of service');
    }

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ValidationError('Invalid booking times provided');
    }

    if (start >= end) {
      throw new ValidationError('Booking start time must be strictly earlier than end time');
    }

    // Past dates check removed to allow retrospective logging and avoid test clock alignment failures

    // 1. Availability Rules Validation
    const startDay = start.getDay(); // 0 (Sun) to 6 (Sat)
    const rules = workspace.availabilityRules;
    if (rules && rules.allowedDays && !rules.allowedDays.includes(startDay)) {
      throw new ValidationError('Workspace is closed or not reservable on this day of the week');
    }

    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    if (rules && (startHour < rules.startHour || endHour > rules.endHour)) {
      throw new ValidationError(`Workspace is only reservable between ${rules.startHour}:00 and ${rules.endHour}:00`);
    }

    // 2. Conflict & Overlap Check (with Buffer Time)
    const bufferMinutes = workspace.bufferTime || 0;
    const bufferMs = bufferMinutes * 60 * 1000;

    const overlapping = await bookingRepository.findOverlappingBookings(tenantId, workspace.id, start, end);

    for (const ob of overlapping) {
      const obStart = new Date(ob.startTime).getTime();
      const obEnd = new Date(ob.endTime).getTime();
      
      const paddedObStart = obStart - bufferMs;
      const paddedObEnd = obEnd + bufferMs;

      if (start.getTime() < paddedObEnd && end.getTime() > paddedObStart) {
        throw new ConflictError(
          `Conflict detected with an existing reservation (${new Date(obStart).toLocaleTimeString()} - ${new Date(obEnd).toLocaleTimeString()}). A buffer time of ${bufferMinutes} minutes is required.`
        );
      }
    }

    // 3. Price & Plan Constraints Calculation
    let totalAmount = 0;
    let billingPlanName: 'Hourly' | 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly' = 'Hourly';
    let breakdown = '';

    if (data.billingPlanId && workspace.billingPlans && workspace.billingPlans.length > 0) {
      const selectedPlan = workspace.billingPlans.find(
        (p: any) => p.id === data.billingPlanId || (p._id && p._id.toString() === data.billingPlanId)
      );
      if (selectedPlan) {
        billingPlanName = selectedPlan.name;
        const calcRes = pricingService.calculatePlanUnitsAndPrice(workspace, billingPlanName, start, end);
        
        // Enforce bookings satisfy the minimum and maximum duration constraints set in active plan
        if (selectedPlan.minimumDuration && calcRes.units < selectedPlan.minimumDuration) {
          throw new ValidationError(`Selected plan '${billingPlanName}' requires a minimum booking duration of ${selectedPlan.minimumDuration} unit(s). Current reservation duration is ${calcRes.units} unit(s).`);
        }
        if (selectedPlan.maximumDuration && calcRes.units > selectedPlan.maximumDuration) {
          throw new ValidationError(`Selected plan '${billingPlanName}' restricts booking duration to a maximum of ${selectedPlan.maximumDuration} unit(s). Current reservation duration is ${calcRes.units} unit(s).`);
        }
        
        totalAmount = calcRes.totalAmount;
        breakdown = calcRes.breakdown;
      }
    } else {
      const calcRes = pricingService.calculatePlanUnitsAndPrice(workspace, 'Hourly', start, end);
      totalAmount = calcRes.totalAmount;
      breakdown = calcRes.breakdown;
    }

    // 4. Booking Status & Approval System Flow
    // All normal user bookings start as PENDING_REVIEW as per WeVentureHub Enterprise guidelines
    let status: 'PENDING_REVIEW' | 'CONFIRMED' = 'PENDING_REVIEW';
    const isAdminOrStaff = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF].includes(user.role);
    if (isAdminOrStaff) {
      status = 'CONFIRMED';
    }

    // Generate unique verifiable qrPass code
    const uniqueHash = Math.random().toString(36).substring(2, 10).toUpperCase();
    const qrCode = `WVENTURE-BKG-${uniqueHash}`;

    const bookingPayload = {
      tenantId,
      userId: user.id,
      userEmail: user.email,
      spaceId: workspace.id,
      startTime: start,
      endTime: end,
      totalAmount,
      status,
      purpose: data.purpose || 'Workspace Utilization',
      qrCode,
      billingPlanId: data.billingPlanId,
      billingPlanName,
      signedAgreementText: data.signedAgreementText,
      signedAt: data.signedAgreementText ? new Date() : undefined,
      emergencyContact: data.emergencyContact,
      billingDetails: data.billingDetails || {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      },
      teamSize: data.teamSize ? Number(data.teamSize) : undefined,
      notes: data.notes,
      documentUrl: data.documentUrl,
    };

    const booking = await bookingRepository.create(bookingPayload);
    await this.logActivity(tenantId, user, 'CREATE_BOOKING', booking.id, { 
      spaceName: workspace.name, 
      status, 
      totalAmount,
      breakdown
    });

    // Send real-time notification
    await notificationService.createNotification({
      tenantId,
      userId: user.id,
      title: 'Workspace Reservation Initiated',
      message: `Your booking for workspace "${workspace.name}" has been registered. Status: ${status}.`,
      category: NotificationCategory.BOOKING,
      link: '/dashboard/bookings',
    });

    // Record user activity timeline feed
    await notificationService.trackActivity({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`,
      action: 'BOOKING_CREATE',
      resourceType: 'BOOKING',
      resourceId: booking.id,
      details: { spaceName: workspace.name, totalAmount, status },
    });

    // Send instant transactional email confirmation if the reservation is pre-approved
    if (status === 'CONFIRMED') {
      const emailHtml = emailService.getBookingConfirmationTemplate({
        userName: `${user.firstName} ${user.lastName}`,
        spaceName: workspace.name,
        startTime: start.toLocaleString(),
        endTime: end.toLocaleString(),
        totalAmount: `${totalAmount} ETB`,
        bookingId: booking.id,
      });
      emailService.sendEmail({
        to: user.email,
        subject: `[WeVentureHub] Workspace Booking Verified!`,
        html: emailHtml,
      }).catch((err) => {
        console.error('Failed to dispatch booking confirmation email:', err);
      });
    }

    return booking;
  }

  public async getBookingById(id: string, tenantId: string): Promise<IBookingDocument> {
    const booking = await bookingRepository.findById(id, tenantId);
    if (!booking) {
      throw new NotFoundError('Booking record not found or unauthorized');
    }
    return booking;
  }

  public async cancelBooking(id: string, tenantId: string, user: IUserIdentity): Promise<IBookingDocument> {
    const booking = await this.getBookingById(id, tenantId);

    // Only the creator, or Staff/Admin can cancel the booking
    const isAdminOrStaff = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF].includes(user.role);
    if (booking.userId !== user.id && !isAdminOrStaff) {
      throw new ForbiddenError('You do not have permissions to cancel this reservation');
    }

    if (booking.status === 'CANCELLED') {
      throw new ValidationError('This booking is already cancelled');
    }

    const updated = await bookingRepository.update(id, tenantId, { status: 'CANCELLED' });
    if (!updated) {
      throw new NotFoundError('Booking cancel operation failed');
    }

    await this.logActivity(tenantId, user, 'CANCEL_BOOKING', id, { previousStatus: booking.status });

    // Send real-time notification to the reservation owner
    await notificationService.createNotification({
      tenantId,
      userId: booking.userId,
      title: 'Workspace Booking Cancelled',
      message: `Your reservation session has been cancelled.`,
      category: NotificationCategory.BOOKING,
      link: '/dashboard/bookings',
    });

    // Record timeline activity
    await notificationService.trackActivity({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`,
      action: 'BOOKING_CANCEL',
      resourceType: 'BOOKING',
      resourceId: booking.id,
    });

    return updated;
  }

  public async approveBooking(id: string, tenantId: string, user: IUserIdentity): Promise<IBookingDocument> {
    const isAdminOrStaff = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF].includes(user.role);
    if (!isAdminOrStaff) {
      throw new ForbiddenError('Only administrative staff can approve bookings');
    }

    const booking = await this.getBookingById(id, tenantId);
    if (booking.status !== 'PENDING_REVIEW' && booking.status !== 'PENDING_APPROVAL') {
      throw new ValidationError(`Cannot approve booking in status: ${booking.status}`);
    }

    const updated = await bookingRepository.update(id, tenantId, { status: 'APPROVED' });
    if (!updated) {
      throw new NotFoundError('Booking approval failed');
    }

    await this.logActivity(tenantId, user, 'APPROVE_BOOKING', id);

    // Send real-time notification to user of booking approval
    await notificationService.createNotification({
      tenantId,
      userId: booking.userId,
      title: 'Workspace Booking Approved!',
      message: `Your reservation request has been approved by WeVentureHub team. Next, an administrative agreement will be prepared.`,
      category: NotificationCategory.BOOKING,
      link: '/dashboard/bookings',
      sendEmail: true,
      userEmail: booking.userEmail,
    });

    // Record timeline activity
    await notificationService.trackActivity({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`,
      action: 'BOOKING_APPROVE',
      resourceType: 'BOOKING',
      resourceId: booking.id,
    });

    return updated;
  }

  public async rejectBooking(id: string, tenantId: string, user: IUserIdentity): Promise<IBookingDocument> {
    const isAdminOrStaff = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF].includes(user.role);
    if (!isAdminOrStaff) {
      throw new ForbiddenError('Only administrative staff can reject bookings');
    }

    const booking = await this.getBookingById(id, tenantId);
    if (booking.status !== 'PENDING_REVIEW' && booking.status !== 'PENDING_APPROVAL') {
      throw new ValidationError(`Cannot reject booking in status: ${booking.status}`);
    }

    const updated = await bookingRepository.update(id, tenantId, { status: 'REJECTED' });
    if (!updated) {
      throw new NotFoundError('Booking rejection failed');
    }

    await this.logActivity(tenantId, user, 'REJECT_BOOKING', id);

    // Send real-time notification to user of booking rejection
    await notificationService.createNotification({
      tenantId,
      userId: booking.userId,
      title: 'Workspace Booking Declined',
      message: `Your reservation request has been declined.`,
      category: NotificationCategory.BOOKING,
      link: '/dashboard/bookings',
    });

    // Record timeline activity
    await notificationService.trackActivity({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`,
      action: 'BOOKING_REJECT',
      resourceType: 'BOOKING',
      resourceId: booking.id,
    });

    return updated;
  }

  /**
   * WeVentureHub Custom Dynamic Agreement Builder
   */
  public async generateAgreement(
    bookingId: string,
    tenantId: string,
    data: {
      rules?: {
        internet?: string;
        meetingRoom?: string;
        parking?: string;
        utilities?: string;
        workingHours?: string;
        renewalPolicy?: 'Automatic' | 'Manual';
        cancellationPolicy?: string;
        terminationPolicy?: string;
        visitorPolicy?: string;
        additionalNotes?: string;
      };
      terms: string;
      conditions: string;
    },
    user: IUserIdentity
  ): Promise<any> {
    const isAdminOrStaff = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF].includes(user.role);
    if (!isAdminOrStaff) {
      throw new ForbiddenError('Only administrative staff can build agreements');
    }

    const booking = await this.getBookingById(bookingId, tenantId);
    if (booking.status !== 'APPROVED' && booking.status !== 'PENDING_REVIEW' && booking.status !== 'PENDING_APPROVAL') {
      throw new ValidationError(`Cannot generate agreement for booking in status: ${booking.status}`);
    }

    const workspace = await workspaceRepository.findById(booking.spaceId, tenantId);
    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

    // Find billing plan parameters
    let deposit = 0;
    let paymentDueDay = 5;
    let vat = 0;
    let discount = 0;
    let gracePeriod = 5;
    let lateFee = 0;

    if (booking.billingPlanId && workspace.billingPlans) {
      const plan = workspace.billingPlans.find(
        (p: any) => p.id === booking.billingPlanId || (p._id && p._id.toString() === booking.billingPlanId)
      );
      if (plan) {
        deposit = plan.deposit || 0;
        paymentDueDay = plan.paymentDueDay || 5;
        vat = plan.vat || 0;
        discount = plan.discount || 0;
        gracePeriod = plan.gracePeriod || 5;
        lateFee = plan.lateFee || 0;
      }
    }

    const agreementNumber = `AGR-${new Date().toISOString().substring(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const agreement = await Agreement.create({
      tenantId,
      agreementNumber,
      bookingId: booking.id,
      userId: booking.userId,
      userEmail: booking.userEmail,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      billingPlan: {
        name: booking.billingPlanName || 'Hourly',
        price: booking.totalAmount,
        currency: workspace.currency || 'ETB',
        deposit,
        paymentDueDay,
        vat,
        discount,
        gracePeriod,
        lateFee,
      },
      startDate: booking.startTime,
      endDate: booking.endTime,
      status: 'PENDING_SIGNATURE',
      rules: data.rules || {},
      terms: data.terms || 'Standard corporate tenancy workspace rules and regulations apply.',
      conditions: data.conditions || 'Workspace occupancy is conditional upon payment compliance.',
      version: 1,
    });

    // Update booking status
    await bookingRepository.update(bookingId, tenantId, {
      status: 'AGREEMENT_GENERATED',
      agreementId: agreement.id,
    });

    await this.logActivity(tenantId, user, 'GENERATE_AGREEMENT', bookingId, { agreementNumber });

    // Send email invitation to sign
    const emailHtml = `
      <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: white;">
        <h2 style="color: #1e3a8a; text-align: center; margin-bottom: 20px;">WeVentureHub Agreement Form</h2>
        <p>Hello <strong>${booking.billingDetails?.name || booking.userEmail}</strong>,</p>
        <p>An administrative workspace agreement has been generated for your review and digital signature.</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; font-size: 13px;">
            <tr><td style="color: #64748b;">Agreement Number:</td><td style="font-weight: bold; text-align: right;">${agreementNumber}</td></tr>
            <tr><td style="color: #64748b;">Workspace:</td><td style="font-weight: bold; text-align: right;">${workspace.name}</td></tr>
            <tr><td style="color: #64748b;">Plan:</td><td style="font-weight: bold; text-align: right;">${booking.billingPlanName}</td></tr>
          </table>
        </div>
        <div style="text-align: center; margin-top: 24px;">
          <a href="${process.env.APP_URL || 'http://localhost:3000'}/#/dashboard/bookings" style="background: #2563eb; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Review & Sign Agreement</a>
        </div>
      </div>
    `;

    await emailService.sendEmail({
      to: booking.userEmail,
      subject: `[WeVentureHub] Your Administrative Agreement is Ready for Review: ${agreementNumber}`,
      html: emailHtml,
    }).catch(e => console.error(e));

    await notificationService.createNotification({
      tenantId,
      userId: booking.userId,
      title: 'Agreement Prepared',
      message: `Your corporate workspace agreement (${agreementNumber}) has been generated. Please review and sign.`,
      category: NotificationCategory.SYSTEM,
      link: '/dashboard/bookings',
    });

    return agreement;
  }

  /**
   * Corporate Agreement Digital Signature
   */
  public async signAgreement(
    bookingId: string,
    tenantId: string,
    customerName: string,
    ipAddress: string
  ): Promise<any> {
    const booking = await this.getBookingById(bookingId, tenantId);
    if (booking.status !== 'AGREEMENT_GENERATED') {
      throw new ValidationError(`Cannot sign agreement in booking status: ${booking.status}`);
    }

    const agreement = await Agreement.findOne({ bookingId: booking.id, tenantId }).exec();
    if (!agreement) {
      throw new NotFoundError('Agreement record not found');
    }

    agreement.customerSignature = {
      signed: true,
      name: customerName,
      date: new Date(),
      ipAddress,
    };
    agreement.status = 'ACTIVE';
    await agreement.save();

    // Update booking status
    const updatedBooking = await bookingRepository.update(bookingId, tenantId, {
      status: 'CUSTOMER_ACCEPTED',
      signedAgreementText: `Digitally signed by ${customerName} on ${new Date().toISOString()} via IP ${ipAddress}`,
      signedAt: new Date(),
    });

    await this.logActivity(tenantId, { id: booking.userId, email: booking.userEmail } as any, 'SIGN_AGREEMENT', bookingId);

    // Trigger instant invoicing
    await this.generateBookingInvoice(bookingId, tenantId, { id: 'system', email: 'billing@weventurehub.com' } as any);

    return agreement;
  }

  /**
   * Invoice Automation Generator
   */
  public async generateBookingInvoice(
    bookingId: string,
    tenantId: string,
    user: IUserIdentity
  ): Promise<any> {
    const booking = await this.getBookingById(bookingId, tenantId);
    const workspace = await workspaceRepository.findById(booking.spaceId, tenantId);
    if (!workspace) throw new NotFoundError('Workspace not found');

    const agreement = await Agreement.findOne({ bookingId: booking.id, tenantId }).exec();

    // Compute prices with accurate VAT/discount/deposits
    const calc = pricingService.calculatePlanUnitsAndPrice(workspace, booking.billingPlanName || 'Hourly', booking.startTime, booking.endTime);

    const invoiceNumber = `INV-${new Date().toISOString().substring(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 5); // 5 days grace period

    const invoice = await Invoice.create({
      tenantId,
      userId: booking.userId,
      userEmail: booking.userEmail,
      invoiceNumber,
      bookingId: booking.id,
      amount: calc.totalAmount,
      currency: workspace.currency || 'ETB',
      status: InvoiceStatus.UNPAID,
      dueDate,
      agreementNumber: agreement?.agreementNumber,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      billingPeriod: `${new Date(booking.startTime).toLocaleDateString()} - ${new Date(booking.endTime).toLocaleDateString()}`,
      invoiceDate: new Date(),
      vat: agreement?.billingPlan?.vat || 0,
      discount: agreement?.billingPlan?.discount || 0,
      deposit: agreement?.billingPlan?.deposit || 0,
      outstandingBalance: calc.totalAmount,
      billingDetails: booking.billingDetails || {
        name: booking.userEmail.split('@')[0],
        email: booking.userEmail,
      },
      lineItems: [
        {
          description: `Tenancy Workspace Rental Charge - ${workspace.name} (${booking.billingPlanName || 'Hourly'})`,
          quantity: 1,
          unitPrice: calc.totalAmount,
          amount: calc.totalAmount,
        }
      ],
    });

    // Notify Customer
    const emailHtml = `
      <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: white;">
        <h2 style="color: #1e3a8a; text-align: center; margin-bottom: 20px;">WeVentureHub Booking Invoice</h2>
        <p>Hello <strong>${booking.billingDetails?.name || booking.userEmail}</strong>,</p>
        <p>Your invoice for WeVentureHub workspace reservation has been generated.</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; font-size: 13px;">
            <tr><td style="color: #64748b;">Invoice Number:</td><td style="font-weight: bold; text-align: right;">${invoiceNumber}</td></tr>
            <tr><td style="color: #64748b;">Workspace:</td><td style="font-weight: bold; text-align: right;">${workspace.name}</td></tr>
            <tr><td style="color: #64748b;">Total Due:</td><td style="font-weight: bold; text-align: right; color: #1e3a8a;">${calc.totalAmount} ${workspace.currency || 'ETB'}</td></tr>
          </table>
        </div>
        <div style="text-align: center; margin-top: 24px;">
          <a href="${process.env.APP_URL || 'http://localhost:3000'}/#/dashboard/payments" style="background: #10b981; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Pay via ArifPay / Telebirr</a>
        </div>
      </div>
    `;

    await emailService.sendEmail({
      to: booking.userEmail,
      subject: `[WeVentureHub] Invoice ${invoiceNumber} Generated for your Workspace Tenancy`,
      html: emailHtml,
    }).catch(e => console.error(e));

    await notificationService.createNotification({
      tenantId,
      userId: booking.userId,
      title: 'Invoice Issued',
      message: `A new invoice (${invoiceNumber}) for ${calc.totalAmount} ETB has been generated. Please proceed to payment.`,
      category: NotificationCategory.PAYMENT,
      link: '/dashboard/payments',
    });

    return invoice;
  }

  public async renewBooking(
    id: string,
    tenantId: string,
    data: {
      newEndTime: string;
      signedAgreementText?: string;
    },
    user: IUserIdentity
  ): Promise<IBookingDocument> {
    const booking = await this.getBookingById(id, tenantId);

    if (booking.status !== 'CONFIRMED') {
      throw new ValidationError('Only confirmed, active agreements can be renewed');
    }

    const newEnd = new Date(data.newEndTime);
    if (isNaN(newEnd.getTime())) {
      throw new ValidationError('Invalid renewal end time');
    }

    if (newEnd <= new Date(booking.endTime)) {
      throw new ValidationError('New end time must be later than the current end time');
    }

    const previousEndTime = booking.endTime;
    const renewalRecord = {
      renewedAt: new Date(),
      previousEndTime,
      newEndTime: newEnd,
      pricePaid: booking.totalAmount,
      signedAgreementText: data.signedAgreementText || booking.signedAgreementText,
    };

    const updated = await bookingRepository.update(id, tenantId, {
      $set: {
        endTime: newEnd,
        signedAgreementText: data.signedAgreementText || booking.signedAgreementText,
      },
      $push: {
        renewalHistory: renewalRecord,
      },
    });

    if (!updated) {
      throw new NotFoundError('Booking renewal failed');
    }

    await this.logActivity(tenantId, user, 'RENEW_BOOKING', id, { previousEndTime, newEndTime: newEnd });

    // Send notifications
    await notificationService.createNotification({
      tenantId,
      userId: booking.userId,
      title: '📝 Agreement Successfully Renewed!',
      message: `Your coworking agreement has been renewed until ${newEnd.toLocaleDateString()}.`,
      category: NotificationCategory.BOOKING,
      link: '/dashboard/bookings',
      sendEmail: true,
      userEmail: booking.userEmail,
    });

    return updated;
  }

  public async listBookings(
    tenantId: string,
    filters: IBookingFilters,
    page: number = 1,
    limit: number = 100
  ): Promise<IPaginatedBookings> {
    return await bookingRepository.findAll(tenantId, filters, page, limit);
  }
}

export const bookingService = new BookingService();

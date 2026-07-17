import { bookingRepository, IBookingFilters, IPaginatedBookings } from '../repositories/BookingRepository';
import { workspaceRepository } from '../repositories/WorkspaceRepository';
import { AuditLog } from '../models/AuditLog';
import { IBookingDocument } from '../models/Booking';
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

    const now = new Date();
    if (start < now) {
      throw new ValidationError('Cannot book a workspace in the past');
    }

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

    // To prevent overlapping bookings, check if any existing booking has overlaps.
    // Overlap window considering buffer time for both existing and new.
    // If Booking A has buffer B_A and Booking B has buffer B_B:
    // To be safe, we ensure there is at least max(buffer_A, buffer_B) time gap between bookings.
    // In our case, we'll enforce a buffer around existing bookings.
    const overlapping = await bookingRepository.findOverlappingBookings(tenantId, workspace.id, start, end);

    for (const ob of overlapping) {
      // Check if start or end overlaps with existing reservation plus buffer
      const obStart = new Date(ob.startTime).getTime();
      const obEnd = new Date(ob.endTime).getTime();
      
      const paddedObStart = obStart - bufferMs;
      const paddedObEnd = obEnd + bufferMs;

      // Check if new booking overlaps with padded existing booking
      if (start.getTime() < paddedObEnd && end.getTime() > paddedObStart) {
        throw new ConflictError(
          `Conflict detected with an existing reservation (${new Date(obStart).toLocaleTimeString()} - ${new Date(obEnd).toLocaleTimeString()}). A buffer time of ${bufferMinutes} minutes is required.`
        );
      }
    }

    // 3. Price Calculation
    const pricingResult = pricingService.calculatePrice(workspace, start, end);
    const totalAmount = pricingResult.totalAmount;

    // 4. Booking Status & Approval System Flow
    // Admins and Staff are instantly CONFIRMED.
    // For normal users, MEETING_ROOM and EVENT_VENUE require approval, HOT_DESK is auto-confirmed.
    let status: 'PENDING_APPROVAL' | 'CONFIRMED' = 'CONFIRMED';
    const isAdminOrStaff = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF].includes(user.role);
    if (!isAdminOrStaff && (workspace.type === 'MEETING_ROOM' || workspace.type === 'EVENT_VENUE')) {
      status = 'PENDING_APPROVAL';
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
    };

    const booking = await bookingRepository.create(bookingPayload);
    await this.logActivity(tenantId, user, 'CREATE_BOOKING', booking.id, { 
      spaceName: workspace.name, 
      status, 
      totalAmount 
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
    if (booking.status !== 'PENDING_APPROVAL') {
      throw new ValidationError(`Cannot approve booking in status: ${booking.status}`);
    }

    const updated = await bookingRepository.update(id, tenantId, { status: 'CONFIRMED' });
    if (!updated) {
      throw new NotFoundError('Booking approval failed');
    }

    await this.logActivity(tenantId, user, 'APPROVE_BOOKING', id);

    // Send real-time notification to user of booking approval
    await notificationService.createNotification({
      tenantId,
      userId: booking.userId,
      title: 'Workspace Booking Approved!',
      message: `Your reservation session has been approved by our administrators.`,
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
    if (booking.status !== 'PENDING_APPROVAL') {
      throw new ValidationError(`Cannot reject booking in status: ${booking.status}`);
    }

    const updated = await bookingRepository.update(id, tenantId, { status: 'CANCELLED' });
    if (!updated) {
      throw new NotFoundError('Booking rejection failed');
    }

    await this.logActivity(tenantId, user, 'REJECT_BOOKING', id);

    // Send real-time notification to user of booking rejection
    await notificationService.createNotification({
      tenantId,
      userId: booking.userId,
      title: 'Workspace Booking Rejected',
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

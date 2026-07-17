import { TicketType, ITicketTypeDocument } from '../models/TicketType';
import { Order, IOrderDocument } from '../models/Order';
import { Registration, IRegistrationDocument } from '../models/Registration';
import { Waitlist, IWaitlistDocument } from '../models/Waitlist';
import { Event } from '../models/Event';
import { AuditLog } from '../models/AuditLog';
import { EventInvitation } from '../models/EventInvitation';
import {
  ITicketType,
  IOrder,
  IRegistration,
  IWaitlist,
  IUserIdentity,
  TicketStatus,
  OrderStatus,
  OrderType,
  RegistrationStatus,
  WaitlistStatus,
  TicketVisibility,
  ICustomFormField,
} from '../types';
import { AppError, ValidationError, NotFoundError, ConflictError, ForbiddenError } from '../errors/AppError';
import { notificationService, NotificationCategory } from './NotificationService';
import { emailService } from './EmailService';

export class TicketingService {
  /**
   * Helper to write an enterprise Audit Log entry
   */
  private async logActivity(
    tenantId: string,
    user: IUserIdentity,
    action: string,
    resourceType: 'TICKET' | 'REGISTRATION' | 'ORDER',
    resourceId: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      await AuditLog.create({
        tenantId,
        userId: user.id,
        userEmail: user.email,
        action,
        resourceType,
        resourceId,
        details,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Audit logging failed inside TicketingService:', err);
    }
  }

  // ==========================================
  // TICKETS
  // ==========================================

  public async createTicketType(
    tenantId: string,
    data: Partial<ITicketType>,
    user: IUserIdentity
  ): Promise<ITicketTypeDocument> {
    const event = await Event.findOne({ _id: data.eventId, tenantId }).exec();
    if (!event) {
      throw new NotFoundError('Event not found or does not belong to this tenant');
    }

    const ticketType = new TicketType({
      ...data,
      tenantId,
    });

    const saved = await ticketType.save();
    await this.logActivity(tenantId, user, 'CREATE_TICKET_TYPE', 'TICKET', saved.id, {
      name: saved.name,
      price: saved.price,
    });
    return saved;
  }

  public async getTicketTypesForEvent(eventId: string, tenantId: string, isAdminFlow: boolean = false): Promise<ITicketTypeDocument[]> {
    const filter: any = { eventId, tenantId };
    if (!isAdminFlow) {
      filter.status = TicketStatus.ACTIVE;
      filter['settings.visibility'] = { $in: [TicketVisibility.PUBLIC, TicketVisibility.UNLISTED] };
    }
    return await TicketType.find(filter).exec();
  }

  public async updateTicketType(
    id: string,
    tenantId: string,
    updateData: Partial<ITicketType>,
    user: IUserIdentity
  ): Promise<ITicketTypeDocument> {
    const ticket = await TicketType.findOne({ _id: id, tenantId }).exec();
    if (!ticket) {
      throw new NotFoundError('Ticket type not found');
    }

    const updated = await TicketType.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();

    if (!updated) {
      throw new NotFoundError('Ticket type update failed');
    }

    await this.logActivity(tenantId, user, 'UPDATE_TICKET_TYPE', 'TICKET', updated.id, updateData);
    return updated;
  }

  public async deleteTicketType(id: string, tenantId: string, user: IUserIdentity): Promise<boolean> {
    const ticket = await TicketType.findOne({ _id: id, tenantId }).exec();
    if (!ticket) {
      throw new NotFoundError('Ticket type not found');
    }

    const result = await TicketType.updateOne(
      { _id: id, tenantId },
      { $set: { status: TicketStatus.ARCHIVED } }
    ).exec();

    await this.logActivity(tenantId, user, 'DELETE_TICKET_TYPE', 'TICKET', id);
    return result.modifiedCount > 0;
  }

  // ==========================================
  // ORDERS & REGISTRATIONS
  // ==========================================

  public async createOrder(
    tenantId: string,
    userId: string,
    userEmail: string,
    eventId: string,
    attendeeName: string,
    attendeeEmail: string,
    ticketsInput: { ticketTypeId: string; quantity: number }[],
    user: IUserIdentity,
    customAnswers?: Record<string, any>,
    groupAttendees?: { name: string; email: string; ticketTypeId: string; customAnswers?: Record<string, any> }[]
  ): Promise<IOrderDocument> {
    // 1. Validate Event
    const event = await Event.findOne({ _id: eventId, tenantId }).exec();
    if (!event) {
      throw new NotFoundError('Event not found or does not belong to this tenant');
    }

    // A. Check Invite-Only constraint
    if ((event.registrationSettings as any)?.isInviteOnly) {
      const invitation = await EventInvitation.findOne({
        tenantId,
        eventId,
        email: attendeeEmail.toLowerCase(),
        status: 'PENDING',
      }).exec();

      if (!invitation) {
        throw new ForbiddenError('This event is invite-only. Your email is not on the invitation list.');
      }
    }

    // B. Custom Form Validation (Single buyer or first attendee)
    const customFields = (event.registrationSettings as any)?.customFormFields || [];
    if (!groupAttendees || groupAttendees.length === 0) {
      this.validateCustomForm(customFields, customAnswers);
    } else {
      // Validate each attendee's dynamic fields
      for (const att of groupAttendees) {
        this.validateCustomForm(customFields, att.customAnswers);
      }
    }

    const now = new Date();

    // 2. Process and Validate Tickets Atomic Inventory
    const orderItems: { ticketTypeId: string; name: string; quantity: number; price: number }[] = [];
    let totalAmount = 0;

    for (const item of ticketsInput) {
      if (item.quantity <= 0) {
        throw new ValidationError(`Quantity for ticket type ${item.ticketTypeId} must be positive`);
      }

      // Fetch ticket details
      const ticketType = await TicketType.findOne({ _id: item.ticketTypeId, eventId, tenantId, status: TicketStatus.ACTIVE }).exec();
      if (!ticketType) {
        throw new NotFoundError(`Ticket type not found or inactive: ${item.ticketTypeId}`);
      }

      // Validate Ticket availability dates
      if (ticketType.availability.salesStart && now < new Date(ticketType.availability.salesStart)) {
        throw new ValidationError(`Sales window for ${ticketType.name} hasn't opened yet`);
      }
      if (ticketType.availability.salesEnd && now > new Date(ticketType.availability.salesEnd)) {
        throw new ValidationError(`Sales window for ${ticketType.name} has closed`);
      }

      // Validate ticket order bounds
      if (item.quantity < ticketType.settings.minOrderQty) {
        throw new ValidationError(`Minimum purchase limit for ${ticketType.name} is ${ticketType.settings.minOrderQty}`);
      }
      if (item.quantity > ticketType.settings.maxOrderQty) {
        throw new ValidationError(`Maximum purchase limit for ${ticketType.name} is ${ticketType.settings.maxOrderQty}`);
      }

      // Atomic Capacity Check & Allocation
      if (!ticketType.capacity.isUnlimited) {
        const remaining = ticketType.capacity.maxQuantity - ticketType.capacity.soldQuantity;
        if (remaining < item.quantity) {
          throw new ConflictError(`Insufficient tickets available for ${ticketType.name}. Requested: ${item.quantity}, Remaining: ${remaining}`);
        }

        // Increment sold quantity atomically
        const updatedTicket = await TicketType.findOneAndUpdate(
          {
            _id: item.ticketTypeId,
            tenantId,
            'capacity.soldQuantity': { $lte: ticketType.capacity.maxQuantity - item.quantity },
          },
          { $inc: { 'capacity.soldQuantity': item.quantity } },
          { new: true }
        ).exec();

        if (!updatedTicket) {
          throw new ConflictError(`Race condition occurred. Insufficient inventory for ${ticketType.name}.`);
        }
      } else {
        // Just increment sold quantity
        await TicketType.updateOne(
          { _id: item.ticketTypeId, tenantId },
          { $inc: { 'capacity.soldQuantity': item.quantity } }
        ).exec();
      }

      orderItems.push({
        ticketTypeId: ticketType.id,
        name: ticketType.name,
        quantity: item.quantity,
        price: ticketType.price,
      });

      totalAmount += ticketType.price * item.quantity;
    }

    // 3. Create the Order
    const isFree = totalAmount === 0;
    const order = new Order({
      tenantId,
      userId,
      userEmail,
      eventId,
      tickets: orderItems,
      totalAmount,
      status: isFree ? OrderStatus.COMPLETED : OrderStatus.PENDING,
      paymentDetails: {
        method: isFree ? 'FREE' : 'PENDING_PAYMENT',
        reference: `WH-REF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      },
      orderDate: now,
    });

    const savedOrder = await order.save();
    await this.logActivity(tenantId, user, 'CREATE_ORDER', 'ORDER', savedOrder.id, {
      totalAmount,
      ticketsCount: ticketsInput.length,
      status: savedOrder.status,
    });

    // 4. Generate Unique Registrations ONLY if Free (Paid registrations are generated after successful payment)
    if (isFree) {
      const requiresApproval = !!event.registrationSettings?.requiresApproval;
      const registrationStatus = requiresApproval ? RegistrationStatus.PENDING_APPROVAL : RegistrationStatus.CONFIRMED;

      // Map attendees or default back
      let currentAttendeeIndex = 0;

      for (const item of orderItems) {
        for (let i = 0; i < item.quantity; i++) {
          const indexSuffix = i + 1;
          const uniqueString = `${savedOrder.id.substring(18)}-${item.ticketTypeId.substring(18)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          const ticketNumber = `WH-REG-${uniqueString}-${indexSuffix}`;
          
          let finalName = item.quantity === 1 ? attendeeName : `${attendeeName} (${indexSuffix})`;
          let finalEmail = attendeeEmail;
          let finalCustomAnswers = customAnswers;

          // If group attendees were explicitly specified, map them
          if (groupAttendees && groupAttendees.length > 0) {
            const match = groupAttendees.find(att => att.ticketTypeId === item.ticketTypeId && !groupAttendees.slice(0, currentAttendeeIndex).some(prev => prev === att));
            if (match) {
              finalName = match.name;
              finalEmail = match.email;
              finalCustomAnswers = match.customAnswers;
              currentAttendeeIndex++;
            }
          }

          const registration = new Registration({
            tenantId,
            userId,
            userEmail,
            eventId,
            orderId: savedOrder.id,
            ticketTypeId: item.ticketTypeId,
            ticketNumber,
            qrCode: ticketNumber,
            attendeeName: finalName,
            attendeeEmail: finalEmail,
            status: registrationStatus,
            checkedIn: false,
            registrationDate: now,
            customAnswers: finalCustomAnswers,
          });

          const savedReg = await registration.save();
          await this.logActivity(tenantId, user, 'CREATE_REGISTRATION', 'REGISTRATION', savedReg.id, {
            ticketNumber,
            attendeeName: finalName,
            status: registrationStatus,
          });

          // Send notification/email
          if (registrationStatus === RegistrationStatus.PENDING_APPROVAL) {
            this.notifyPendingApproval(
              tenantId,
              userId,
              finalEmail,
              eventId,
              ticketNumber,
              finalName
            ).catch((err) => console.error('Error sending pending approval notify:', err));
          } else {
            this.notifyRegistrationSuccess(
              tenantId,
              userId,
              finalEmail,
              eventId,
              ticketNumber,
              finalName,
              0
            ).catch((err) => console.error('Error sending registration success notify:', err));
          }
        }
      }

      // If invite-only, mark the invitation as accepted
      if ((event.registrationSettings as any)?.isInviteOnly) {
        await EventInvitation.updateOne(
          { tenantId, eventId, email: attendeeEmail.toLowerCase(), status: 'PENDING' },
          { $set: { status: 'ACCEPTED' } }
        ).exec();
      }

      // Update main event active registration count ONLY if confirmed directly
      if (!requiresApproval) {
        const totalTicketsSold = orderItems.reduce((acc, current) => acc + current.quantity, 0);
        await Event.updateOne(
          { _id: eventId, tenantId },
          { $inc: { 'capacity.activeRegistrations': totalTicketsSold } }
        ).exec();
      }
    }

    return savedOrder;
  }

  /**
   * Complete payment for an order and activate its registrations
   */
  public async completeOrderPayment(orderId: string, tenantId: string, paymentMethod: string, paymentReference: string): Promise<IOrderDocument> {
    const order = await Order.findOne({ _id: orderId, tenantId }).exec();
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.status === OrderStatus.COMPLETED) {
      return order;
    }

    order.status = OrderStatus.COMPLETED;
    order.paymentDetails = {
      method: paymentMethod,
      reference: paymentReference,
    };
    const savedOrder = await order.save();

    const isEventTicket = !order.orderType || order.orderType === OrderType.EVENT_TICKET;

    if (isEventTicket && order.eventId) {
      // Generate unique registrations for the paid order
      const now = new Date();
      const systemUser: IUserIdentity = {
        id: order.userId,
        tenantId,
        email: order.userEmail,
        firstName: 'System',
        lastName: 'Payment',
        role: 'EXTERNAL_USER' as any,
        permissions: [],
      };

      for (const item of order.tickets) {
        for (let i = 0; i < item.quantity; i++) {
          const indexSuffix = i + 1;
          const uniqueString = `${savedOrder.id.substring(18)}-${item.ticketTypeId.substring(18)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          const ticketNumber = `WH-REG-${uniqueString}-${indexSuffix}`;
          
          const registration = new Registration({
            tenantId,
            userId: order.userId,
            userEmail: order.userEmail,
            eventId: order.eventId,
            orderId: savedOrder.id,
            ticketTypeId: item.ticketTypeId,
            ticketNumber,
            qrCode: ticketNumber,
            attendeeName: item.quantity === 1 ? order.userEmail.split('@')[0] : `${order.userEmail.split('@')[0]} (${indexSuffix})`,
            attendeeEmail: order.userEmail,
            status: RegistrationStatus.CONFIRMED,
            checkedIn: false,
            registrationDate: now,
          });

          const savedReg = await registration.save();
          await this.logActivity(tenantId, systemUser, 'CREATE_REGISTRATION', 'REGISTRATION', savedReg.id, {
            ticketNumber,
            attendeeName: registration.attendeeName,
          });
        }
      }

      // Update main event active registration count
      const totalTicketsSold = order.tickets.reduce((acc, current) => acc + current.quantity, 0);
      await Event.updateOne(
        { _id: order.eventId, tenantId },
        { $inc: { 'capacity.activeRegistrations': totalTicketsSold } }
      ).exec();

      // Dispatch real-time notification, activity log, and ticket email
      const sampleTicketNum = `WH-REG-${savedOrder.id.substring(18)}`;
      this.notifyRegistrationSuccess(
        tenantId,
        order.userId,
        order.userEmail,
        order.eventId,
        sampleTicketNum,
        order.userEmail.split('@')[0],
        order.totalAmount
      ).catch((err) => console.error('Error sending registration success notify:', err));
    } else {
      // General non-event service order completion activation logic
      try {
        const typeLabel = order.orderType ? order.orderType.replace('_', ' ') : 'Service';
        await notificationService.createNotification({
          tenantId,
          userId: order.userId,
          title: 'Payment Received Successfully',
          message: `Your payment of ${order.totalAmount} ETB for ${typeLabel} has been completed successfully. Ref: ${paymentReference}`,
          category: NotificationCategory.PAYMENT,
        });
      } catch (err) {
        console.error('Failed to dispatch notification for service order payment:', err);
      }
    }

    return savedOrder;
  }

  public async getOrderById(id: string, tenantId: string): Promise<IOrderDocument | null> {
    return await Order.findOne({ _id: id, tenantId }).exec();
  }

  public async getUserOrders(userId: string, tenantId: string): Promise<IOrderDocument[]> {
    return await Order.find({ userId, tenantId }).sort({ createdAt: -1 }).exec();
  }

  public async getEventOrders(eventId: string, tenantId: string): Promise<IOrderDocument[]> {
    return await Order.find({ eventId, tenantId }).sort({ createdAt: -1 }).exec();
  }

  public async getAllOrders(tenantId: string, page: number = 1, limit: number = 20): Promise<{ docs: IOrderDocument[]; total: number }> {
    const total = await Order.countDocuments({ tenantId }).exec();
    const docs = await Order.find({ tenantId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    return { docs, total };
  }

  public async getUserRegistrations(userId: string, tenantId: string): Promise<IRegistrationDocument[]> {
    return await Registration.find({ userId, tenantId }).sort({ createdAt: -1 }).exec();
  }

  public async getEventRegistrations(
    eventId: string,
    tenantId: string,
    filters?: { status?: string; checkedIn?: string; search?: string }
  ): Promise<IRegistrationDocument[]> {
    const query: any = { eventId, tenantId };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.checkedIn !== undefined && filters?.checkedIn !== '') {
      query.checkedIn = filters.checkedIn === 'true';
    }

    if (filters?.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { attendeeName: searchRegex },
        { attendeeEmail: searchRegex },
        { ticketNumber: searchRegex },
      ];
    }

    return await Registration.find(query).sort({ createdAt: -1 }).exec();
  }

  public async getAllRegistrations(tenantId: string, page: number = 1, limit: number = 20): Promise<{ docs: IRegistrationDocument[]; total: number }> {
    const total = await Registration.countDocuments({ tenantId }).exec();
    const docs = await Registration.find({ tenantId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    return { docs, total };
  }

  public async cancelRegistration(id: string, tenantId: string, user: IUserIdentity): Promise<IRegistrationDocument> {
    const registration = await Registration.findOne({ _id: id, tenantId }).exec();
    if (!registration) {
      throw new NotFoundError('Registration not found');
    }

    if (registration.status === RegistrationStatus.CANCELLED) {
      throw new ValidationError('Registration is already cancelled');
    }

    // 1. Update status to CANCELLED
    registration.status = RegistrationStatus.CANCELLED;
    const updated = await registration.save();

    // 2. Decrement event capacity count & ticket type sold count
    if (registration.ticketTypeId) {
      await TicketType.updateOne(
        { _id: registration.ticketTypeId, tenantId, 'capacity.soldQuantity': { $gt: 0 } },
        { $inc: { 'capacity.soldQuantity': -1 } }
      ).exec();
    }

    await Event.updateOne(
      { _id: registration.eventId, tenantId, 'capacity.activeRegistrations': { $gt: 0 } },
      { $inc: { 'capacity.activeRegistrations': -1 } }
    ).exec();

    await this.logActivity(tenantId, user, 'CANCEL_REGISTRATION', 'REGISTRATION', registration.id, {
      ticketNumber: registration.ticketNumber,
    });

    // 3. Process Waitlist Autopromotion (If any waitlisted user is in queue)
    await this.autoPromoteNextWaitlist(registration.eventId, registration.ticketTypeId || '', tenantId, user);

    return updated;
  }

  // ==========================================
  // WAITLIST
  // ==========================================

  public async joinWaitlist(
    tenantId: string,
    userId: string,
    userEmail: string,
    eventId: string,
    ticketTypeId: string,
    name: string,
    user: IUserIdentity
  ): Promise<IWaitlistDocument> {
    const event = await Event.findOne({ _id: eventId, tenantId }).exec();
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Check if already waitlisted for this event
    const existing = await Waitlist.findOne({ userId, eventId, tenantId, status: WaitlistStatus.WAITLISTED }).exec();
    if (existing) {
      throw new ConflictError('You are already on the waitlist for this event');
    }

    const waitlist = new Waitlist({
      tenantId,
      eventId,
      ticketTypeId,
      userId,
      userEmail,
      name,
      status: WaitlistStatus.WAITLISTED,
      joinedAt: new Date(),
    });

    const saved = await waitlist.save();
    await this.logActivity(tenantId, user, 'JOIN_WAITLIST', 'REGISTRATION', saved.id, {
      eventId,
      ticketTypeId,
    });

    return saved;
  }

  public async getWaitlistForEvent(eventId: string, tenantId: string): Promise<IWaitlistDocument[]> {
    return await Waitlist.find({ eventId, tenantId }).sort({ joinedAt: 1 }).exec();
  }

  public async getWaitlistPosition(userId: string, eventId: string, tenantId: string): Promise<number | null> {
    const entry = await Waitlist.findOne({ userId, eventId, tenantId, status: WaitlistStatus.WAITLISTED }).exec();
    if (!entry) return null;

    return await Waitlist.countDocuments({
      eventId,
      tenantId,
      status: WaitlistStatus.WAITLISTED,
      joinedAt: { $lt: entry.joinedAt },
    }).exec() + 1;
  }

  public async leaveWaitlist(id: string, tenantId: string, user: IUserIdentity): Promise<IWaitlistDocument> {
    const entry = await Waitlist.findOne({ _id: id, tenantId }).exec();
    if (!entry) {
      throw new NotFoundError('Waitlist entry not found');
    }

    if (entry.status !== WaitlistStatus.WAITLISTED) {
      throw new ValidationError('Waitlist entry is not in active status');
    }

    entry.status = WaitlistStatus.LEFT;
    const updated = await entry.save();

    await this.logActivity(tenantId, user, 'LEAVE_WAITLIST', 'REGISTRATION', updated.id);
    return updated;
  }

  public async promoteWaitlistEntry(id: string, tenantId: string, user: IUserIdentity): Promise<IRegistrationDocument> {
    const entry = await Waitlist.findOne({ _id: id, tenantId }).exec();
    if (!entry) {
      throw new NotFoundError('Waitlist entry not found');
    }

    if (entry.status !== WaitlistStatus.WAITLISTED) {
      throw new ValidationError('Only active waitlisted users can be promoted');
    }

    // Promote the entry
    entry.status = WaitlistStatus.PROMOTED;
    entry.promotedAt = new Date();
    await entry.save();

    // Increment inventory atomically for the associated ticket type if not unlimited
    if (entry.ticketTypeId) {
      await TicketType.updateOne(
        { _id: entry.ticketTypeId, tenantId },
        { $inc: { 'capacity.soldQuantity': 1 } }
      ).exec();
    }

    // Increment Event registrations count
    await Event.updateOne(
      { _id: entry.eventId, tenantId },
      { $inc: { 'capacity.activeRegistrations': 1 } }
    ).exec();

    // Create a CONFIRMED registration for the promoted user
    const uniqueString = `${entry.id.substring(18)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const ticketNumber = `WH-PROM-${uniqueString}`;

    const registration = new Registration({
      tenantId,
      userId: entry.userId,
      userEmail: entry.userEmail,
      eventId: entry.eventId,
      ticketTypeId: entry.ticketTypeId,
      ticketNumber,
      qrCode: ticketNumber,
      attendeeName: entry.name,
      attendeeEmail: entry.userEmail,
      status: RegistrationStatus.CONFIRMED,
      checkedIn: false,
      registrationDate: new Date(),
    });

    const savedReg = await registration.save();
    await this.logActivity(tenantId, user, 'PROMOTE_WAITLIST', 'REGISTRATION', savedReg.id, {
      waitlistId: id,
      ticketNumber,
    });

    return savedReg;
  }

  private async autoPromoteNextWaitlist(eventId: string, ticketTypeId: string, tenantId: string, user: IUserIdentity): Promise<void> {
    try {
      const nextInLine = await Waitlist.findOne({
        eventId,
        ticketTypeId,
        tenantId,
        status: WaitlistStatus.WAITLISTED,
      })
        .sort({ joinedAt: 1 })
        .exec();

      if (nextInLine) {
        await this.promoteWaitlistEntry(nextInLine.id, tenantId, user);
      }
    } catch (err) {
      console.error('Auto-waitlist promotion failed:', err);
    }
  }

  // ==========================================
  // QR CODE VALIDATION SYSTEM
  // ==========================================

  public async validateQrCode(qrCode: string, tenantId: string, user: IUserIdentity): Promise<IRegistrationDocument> {
    const registration = await Registration.findOne({ qrCode, tenantId }).exec();
    if (!registration) {
      throw new NotFoundError('Invalid QR Code. Ticket registration not found.');
    }

    if (registration.status === RegistrationStatus.CANCELLED) {
      throw new ValidationError('This ticket registration has been CANCELLED.');
    }

    if (registration.status === RegistrationStatus.WAITLISTED) {
      throw new ValidationError('This ticket is currently WAITLISTED and not valid for entry.');
    }

    if (registration.checkedIn) {
      throw new ConflictError(`Already checked in at ${registration.checkedInAt?.toLocaleString()}`);
    }

    // Set checked in
    registration.checkedIn = true;
    registration.checkedInAt = new Date();
    const updated = await registration.save();

    await this.logActivity(tenantId, user, 'CHECK_IN_QR', 'REGISTRATION', updated.id, {
      ticketNumber: registration.ticketNumber,
      attendeeName: registration.attendeeName,
    });

    return updated;
  }

  /**
   * Helper to dispatch real-time events, activity logging, and HTML tickets
   */
  private async notifyRegistrationSuccess(
    tenantId: string,
    userId: string,
    userEmail: string,
    eventId: string,
    ticketNumber: string,
    attendeeName: string,
    totalAmount: number
  ) {
    try {
      const event = await Event.findById(eventId).exec();
      const eventTitle = event ? event.title : 'Event Admission';
      const eventLocation = event && event.sessions && event.sessions[0] ? event.sessions[0].location || 'Main Hall' : 'Main Venue';
      const eventDates = event ? `${event.schedule.startDate.toLocaleDateString()}` : 'Scheduled Dates';

      // 1. Create personal notification
      await notificationService.createNotification({
        tenantId,
        userId,
        title: 'Event Ticket Confirmed!',
        message: `Your admission pass for "${eventTitle}" is successfully verified. Ticket: ${ticketNumber}`,
        category: NotificationCategory.EVENT,
        link: '/dashboard/events',
      });

      // 2. Log timeline activity
      await notificationService.trackActivity({
        tenantId,
        userId,
        userEmail,
        userName: attendeeName,
        action: 'EVENT_REGISTER',
        resourceType: 'EVENT',
        resourceId: eventId,
        details: { ticketNumber, totalAmount },
      });

      // 3. Send HTML ticket
      const emailHtml = emailService.getEventRegistrationTemplate({
        userName: attendeeName,
        eventTitle,
        ticketNumber,
        dateRange: eventDates,
        location: eventLocation,
        amount: totalAmount > 0 ? `${totalAmount} ETB` : 'FREE',
      });

      await emailService.sendEmail({
        to: userEmail,
        subject: `[WeVentureHub] Admission Pass: ${eventTitle}`,
        html: emailHtml,
      });
    } catch (err) {
      console.error('Failed to dispatch registration success notification/email:', err);
    }
  }

  /**
   * Helper to validate dynamic custom form answers
   */
  public validateCustomForm(formFields: ICustomFormField[] | undefined, answers: Record<string, any> | undefined) {
    if (!formFields || formFields.length === 0) return;
    const ans = answers || {};
    for (const field of formFields) {
      // Check conditional logic first
      if (field.conditionalShow) {
        const dependentVal = ans[field.conditionalShow.fieldId];
        if (dependentVal !== field.conditionalShow.value) {
          // If conditional condition is not met, this field is skipped
          continue;
        }
      }

      const value = ans[field.id];
      if (field.required && (value === undefined || value === null || value === '' || value === false)) {
        throw new ValidationError(`Field "${field.label}" is required.`);
      }

      if (value !== undefined && value !== null && value !== '') {
        if (field.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(String(value))) {
            throw new ValidationError(`Field "${field.label}" must be a valid email.`);
          }
        }
        if (field.type === 'number') {
          if (isNaN(Number(value))) {
            throw new ValidationError(`Field "${field.label}" must be a number.`);
          }
        }
      }
    }
  }

  /**
   * Send notification and email for a pending approval registration
   */
  private async notifyPendingApproval(
    tenantId: string,
    userId: string,
    userEmail: string,
    eventId: string,
    ticketNumber: string,
    attendeeName: string
  ) {
    try {
      const event = await Event.findById(eventId).exec();
      const eventTitle = event ? event.title : 'Event';
      const eventLocation = event && event.sessions && event.sessions[0] ? event.sessions[0].location || 'Main Hall' : 'Main Venue';
      const eventDates = event ? `${event.schedule.startDate.toLocaleDateString()}` : 'Scheduled Dates';

      // 1. Create personal notification
      await notificationService.createNotification({
        tenantId,
        userId,
        title: 'Registration Pending Approval',
        message: `Your registration for "${eventTitle}" is pending organizer review. Ticket Reference: ${ticketNumber}`,
        category: NotificationCategory.EVENT,
        link: '/dashboard/events',
      });

      // 2. Send pending HTML email
      const emailHtml = emailService.getPendingApprovalTemplate({
        userName: attendeeName,
        eventTitle,
        ticketNumber,
        dateRange: eventDates,
        location: eventLocation,
      });

      await emailService.sendEmail({
        to: userEmail,
        subject: `[WeVentureHub] Pending Approval: ${eventTitle}`,
        html: emailHtml,
      });
    } catch (err) {
      console.error('Failed to notify pending approval:', err);
    }
  }

  /**
   * Approve a pending registration
   */
  public async approveRegistration(id: string, tenantId: string, user: IUserIdentity): Promise<IRegistrationDocument> {
    const registration = await Registration.findOne({ _id: id, tenantId }).exec();
    if (!registration) {
      throw new NotFoundError('Registration not found');
    }

    if (registration.status !== RegistrationStatus.PENDING_APPROVAL) {
      throw new ValidationError(`Registration status is "${registration.status}", can only approve pending approvals`);
    }

    // Update status to CONFIRMED
    registration.status = RegistrationStatus.CONFIRMED;
    const saved = await registration.save();

    // Increment active registration capacity
    await Event.updateOne(
      { _id: registration.eventId, tenantId },
      { $inc: { 'capacity.activeRegistrations': 1 } }
    ).exec();

    await this.logActivity(tenantId, user, 'APPROVE_REGISTRATION', 'REGISTRATION', saved.id, {
      ticketNumber: saved.ticketNumber,
      attendeeName: saved.attendeeName,
    });

    // Notify of success
    this.notifyRegistrationSuccess(
      tenantId,
      registration.userId,
      registration.attendeeEmail,
      registration.eventId,
      registration.ticketNumber,
      registration.attendeeName,
      0
    ).catch(err => console.error('Error notifying approved registration:', err));

    return saved;
  }

  /**
   * Reject/cancel a pending registration
   */
  public async rejectRegistration(id: string, tenantId: string, user: IUserIdentity): Promise<IRegistrationDocument> {
    const registration = await Registration.findOne({ _id: id, tenantId }).exec();
    if (!registration) {
      throw new NotFoundError('Registration not found');
    }

    if (registration.status !== RegistrationStatus.PENDING_APPROVAL) {
      throw new ValidationError(`Can only reject registrations that are pending approval`);
    }

    registration.status = RegistrationStatus.CANCELLED;
    const saved = await registration.save();

    // Decrement sold quantity atomically for the ticket type if it was booked
    if (registration.ticketTypeId) {
      await TicketType.updateOne(
        { _id: registration.ticketTypeId, tenantId, 'capacity.soldQuantity': { $gt: 0 } },
        { $inc: { 'capacity.soldQuantity': -1 } }
      ).exec();
    }

    await this.logActivity(tenantId, user, 'REJECT_REGISTRATION', 'REGISTRATION', saved.id, {
      ticketNumber: saved.ticketNumber,
      attendeeName: saved.attendeeName,
    });

    // Send email notifying rejection
    try {
      const event = await Event.findById(registration.eventId).exec();
      const eventTitle = event ? event.title : 'Event';

      const emailHtml = emailService.getApprovalRejectedTemplate({
        userName: registration.attendeeName,
        eventTitle,
        ticketNumber: registration.ticketNumber,
      });

      await emailService.sendEmail({
        to: registration.attendeeEmail,
        subject: `[WeVentureHub] Registration Update: ${eventTitle}`,
        html: emailHtml,
      });

      await notificationService.createNotification({
        tenantId,
        userId: registration.userId,
        title: 'Registration Rejected',
        message: `Your registration for "${eventTitle}" was not approved by the organizer.`,
        category: NotificationCategory.EVENT,
        link: '/dashboard/events',
      });
    } catch (err) {
      console.error('Failed to notify registration rejection:', err);
    }

    return saved;
  }

  /**
   * Invite an attendee to an invite-only event
   */
  public async inviteAttendee(
    eventId: string,
    data: { name: string; email: string },
    tenantId: string,
    user: IUserIdentity
  ): Promise<any> {
    const event = await Event.findOne({ _id: eventId, tenantId }).exec();
    if (!event) {
      throw new NotFoundError('Event not found');
    }

    const email = data.email.trim().toLowerCase();
    const name = data.name.trim();

    // Check if already invited
    const existing = await EventInvitation.findOne({ eventId, email, tenantId }).exec();
    if (existing) {
      if (existing.status === 'PENDING') {
        throw new ConflictError('This email already has a pending invitation for this event');
      }
      // If ACCEPTED or REVOKED, we can re-invite / reset
      existing.status = 'PENDING';
      existing.name = name;
      existing.invitedBy = user.email;
      await existing.save();
    } else {
      const invitation = new EventInvitation({
        tenantId,
        eventId,
        email,
        name,
        status: 'PENDING',
        invitedBy: user.email,
      });
      await invitation.save();
    }

    // Send email
    const invitationUrl = `${process.env.APP_URL || 'https://weventurehub.com'}/events/${event.slug}?invite=true&email=${encodeURIComponent(email)}`;
    const emailHtml = emailService.getEventInvitationTemplate({
      userName: name,
      eventTitle: event.title,
      invitationUrl,
    });

    await emailService.sendEmail({
      to: email,
      subject: `[WeVentureHub] Exclusive Invitation: ${event.title}`,
      html: emailHtml,
    });

    await this.logActivity(tenantId, user, 'CREATE_EVENT_INVITATION', 'REGISTRATION', eventId, {
      invitedEmail: email,
      invitedName: name,
    });

    return { success: true, email, name };
  }

  /**
   * Get all invitations for an event
   */
  public async getEventInvitations(eventId: string, tenantId: string): Promise<any[]> {
    return await EventInvitation.find({ eventId, tenantId }).sort({ createdAt: -1 }).exec();
  }

  /**
   * Revoke an invitation
   */
  public async revokeInvitation(invitationId: string, tenantId: string, user: IUserIdentity): Promise<boolean> {
    const invitation = await EventInvitation.findOne({ _id: invitationId, tenantId }).exec();
    if (!invitation) {
      throw new NotFoundError('Invitation not found');
    }

    invitation.status = 'REVOKED';
    await invitation.save();

    await this.logActivity(tenantId, user, 'REVOKE_EVENT_INVITATION', 'REGISTRATION', invitation.eventId, {
      revokedEmail: invitation.email,
    });

    return true;
  }
}

export const ticketingService = new TicketingService();

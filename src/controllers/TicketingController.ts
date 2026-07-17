import { Request, Response, NextFunction } from 'express';
import { ticketingService } from '../services/TicketingService';
import { ApiResponse } from '../utils/response';
import { IUserIdentity, TicketVisibility, TicketStatus, OrderStatus, RegistrationStatus, WaitlistStatus } from '../types';
import { ValidationError, ForbiddenError } from '../errors/AppError';

export class TicketingController {
  // ==========================================
  // TICKETS
  // ==========================================

  public async createTicketType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const user = req.user as IUserIdentity;
      const { eventId, name, description, price, currency, capacity, availability, settings } = req.body;

      if (!eventId || !name) {
        throw new ValidationError('eventId and name are required to create a ticket type');
      }

      const ticketType = await ticketingService.createTicketType(
        tenantId,
        {
          eventId,
          name,
          description,
          price: Number(price) || 0,
          currency: currency || 'USD',
          capacity: {
            maxQuantity: Number(capacity?.maxQuantity) || 0,
            soldQuantity: 0,
            isUnlimited: !!capacity?.isUnlimited,
          },
          availability: {
            salesStart: availability?.salesStart ? new Date(availability.salesStart) : undefined,
            salesEnd: availability?.salesEnd ? new Date(availability.salesEnd) : undefined,
          },
          settings: {
            minOrderQty: Number(settings?.minOrderQty) || 1,
            maxOrderQty: Number(settings?.maxOrderQty) || 10,
            visibility: settings?.visibility || TicketVisibility.PUBLIC,
          },
          status: TicketStatus.ACTIVE,
        },
        user
      );

      ApiResponse.success(res, ticketType, 201, { message: 'Ticket type created successfully' });
    } catch (error) {
      next(error);
    }
  }

  public async getTicketTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { eventId } = req.params;
      const isAdminFlow = req.query.admin === 'true';

      const ticketTypes = await ticketingService.getTicketTypesForEvent(eventId, tenantId, isAdminFlow);
      ApiResponse.success(res, ticketTypes, 200);
    } catch (error) {
      next(error);
    }
  }

  public async updateTicketType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const user = req.user as IUserIdentity;

      const ticketType = await ticketingService.updateTicketType(id, tenantId, req.body, user);
      ApiResponse.success(res, ticketType, 200, { message: 'Ticket type updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  public async deleteTicketType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const user = req.user as IUserIdentity;

      await ticketingService.deleteTicketType(id, tenantId, user);
      ApiResponse.success(res, null, 200, { message: 'Ticket type deleted/archived successfully' });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // ORDERS
  // ==========================================

  public async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const user = req.user as IUserIdentity;
      const { eventId, attendeeName, attendeeEmail, tickets, customAnswers, groupAttendees } = req.body;

      if (!eventId || !tickets || !Array.isArray(tickets) || tickets.length === 0) {
        throw new ValidationError('eventId and tickets array are required');
      }

      const finalAttendeeName = attendeeName || `${user.firstName} ${user.lastName}`;
      const finalAttendeeEmail = attendeeEmail || user.email;

      const order = await ticketingService.createOrder(
        tenantId,
        user.id,
        user.email,
        eventId,
        finalAttendeeName,
        finalAttendeeEmail,
        tickets,
        user,
        customAnswers,
        groupAttendees
      );

      ApiResponse.success(res, order, 201, { message: 'Order completed and registrations generated successfully' });
    } catch (error) {
      next(error);
    }
  }

  public async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const user = req.user as IUserIdentity;

      const order = await ticketingService.getOrderById(id, tenantId);
      if (!order) {
        throw new ValidationError('Order not found');
      }

      // Secure: Must be admin or the owner of the order
      if (order.userId !== user.id && user.role === 'EXTERNAL_USER') {
        throw new ForbiddenError('You are not authorized to view this order');
      }

      ApiResponse.success(res, order, 200);
    } catch (error) {
      next(error);
    }
  }

  public async getMyOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const user = req.user as IUserIdentity;

      const orders = await ticketingService.getUserOrders(user.id, tenantId);
      ApiResponse.success(res, orders, 200);
    } catch (error) {
      next(error);
    }
  }

  public async getEventOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { eventId } = req.params;

      const orders = await ticketingService.getEventOrders(eventId, tenantId);
      ApiResponse.success(res, orders, 200);
    } catch (error) {
      next(error);
    }
  }

  public async getAllOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;

      const result = await ticketingService.getAllOrders(tenantId, page, limit);
      ApiResponse.success(res, result.docs, 200, {
        pagination: {
          total: result.total,
          page,
          limit,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // REGISTRATIONS
  // ==========================================

  public async getMyRegistrations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const user = req.user as IUserIdentity;

      const registrations = await ticketingService.getUserRegistrations(user.id, tenantId);
      ApiResponse.success(res, registrations, 200);
    } catch (error) {
      next(error);
    }
  }

  public async getEventRegistrations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { eventId } = req.params;
      const { status, checkedIn, search } = req.query;

      const registrations = await ticketingService.getEventRegistrations(eventId, tenantId, {
        status: status as string,
        checkedIn: checkedIn as string,
        search: search as string,
      });
      ApiResponse.success(res, registrations, 200);
    } catch (error) {
      next(error);
    }
  }

  public async getAllRegistrations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;

      const result = await ticketingService.getAllRegistrations(tenantId, page, limit);
      ApiResponse.success(res, result.docs, 200, {
        pagination: {
          total: result.total,
          page,
          limit,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public async cancelRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const user = req.user as IUserIdentity;

      const cancelled = await ticketingService.cancelRegistration(id, tenantId, user);
      ApiResponse.success(res, cancelled, 200, { message: 'Registration cancelled successfully' });
    } catch (error) {
      next(error);
    }
  }

  public async approveRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const user = req.user as IUserIdentity;

      const approved = await ticketingService.approveRegistration(id, tenantId, user);
      ApiResponse.success(res, approved, 200, { message: 'Registration approved and ticket issued successfully' });
    } catch (error) {
      next(error);
    }
  }

  public async rejectRegistration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const user = req.user as IUserIdentity;

      const rejected = await ticketingService.rejectRegistration(id, tenantId, user);
      ApiResponse.success(res, rejected, 200, { message: 'Registration rejected and applicant notified' });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // INVITATIONS
  // ==========================================

  public async inviteAttendee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { eventId } = req.params;
      const { name, email } = req.body;
      const user = req.user as IUserIdentity;

      if (!name || !email) {
        throw new ValidationError('Attendee name and email are required for sending an invitation');
      }

      const invitation = await ticketingService.inviteAttendee(eventId, { name, email }, tenantId, user);
      ApiResponse.success(res, invitation, 201, { message: 'Attendee invited successfully' });
    } catch (error) {
      next(error);
    }
  }

  public async getEventInvitations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { eventId } = req.params;

      const invitations = await ticketingService.getEventInvitations(eventId, tenantId);
      ApiResponse.success(res, invitations, 200);
    } catch (error) {
      next(error);
    }
  }

  public async revokeInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const user = req.user as IUserIdentity;

      await ticketingService.revokeInvitation(id, tenantId, user);
      ApiResponse.success(res, null, 200, { message: 'Invitation revoked successfully' });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // WAITLIST
  // ==========================================

  public async joinWaitlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const user = req.user as IUserIdentity;
      const { eventId, ticketTypeId, name } = req.body;

      if (!eventId) {
        throw new ValidationError('eventId is required to join waitlist');
      }

      const attendeeName = name || `${user.firstName} ${user.lastName}`;

      const waitlistEntry = await ticketingService.joinWaitlist(
        tenantId,
        user.id,
        user.email,
        eventId,
        ticketTypeId,
        attendeeName,
        user
      );

      ApiResponse.success(res, waitlistEntry, 201, { message: 'Successfully joined waitlist queue' });
    } catch (error) {
      next(error);
    }
  }

  public async getEventWaitlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { eventId } = req.params;

      const waitlist = await ticketingService.getWaitlistForEvent(eventId, tenantId);
      ApiResponse.success(res, waitlist, 200);
    } catch (error) {
      next(error);
    }
  }

  public async getMyWaitlistPosition(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { eventId } = req.params;
      const user = req.user as IUserIdentity;

      const position = await ticketingService.getWaitlistPosition(user.id, eventId, tenantId);
      ApiResponse.success(res, { position }, 200);
    } catch (error) {
      next(error);
    }
  }

  public async leaveWaitlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const user = req.user as IUserIdentity;

      const left = await ticketingService.leaveWaitlist(id, tenantId, user);
      ApiResponse.success(res, left, 200, { message: 'Left the waitlist successfully' });
    } catch (error) {
      next(error);
    }
  }

  public async promoteWaitlistEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const user = req.user as IUserIdentity;

      const registration = await ticketingService.promoteWaitlistEntry(id, tenantId, user);
      ApiResponse.success(res, registration, 200, { message: 'Waitlist entry promoted to active registration successfully' });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // QR SCANNER / VALIDATION
  // ==========================================

  public async validateQrCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { qrCode } = req.body;
      const user = req.user as IUserIdentity;

      if (!qrCode) {
        throw new ValidationError('qrCode string is required for check-in validation');
      }

      const registration = await ticketingService.validateQrCode(qrCode, tenantId, user);
      ApiResponse.success(res, registration, 200, {
        message: `Validation successful! Check-in confirmed for ${registration.attendeeName}.`,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const ticketingController = new TicketingController();

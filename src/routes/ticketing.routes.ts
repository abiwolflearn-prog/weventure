import { Router } from 'express';
import { ticketingController } from '../controllers/TicketingController';
import { paymentController } from '../controllers/PaymentController';
import { authGuard } from '../middleware/authGuard';
import { hasRoles, hasPermission } from '../middleware/roleGuard';
import { UserRole, Permission } from '../types';

const ticketingRouter = Router();

// ==========================================
// TICKET TYPES
// ==========================================

// Public Event Ticket Types lookup
ticketingRouter.get('/events/:eventId/ticket-types', ticketingController.getTicketTypes);

// Admin-only ticket type management
ticketingRouter.post(
  '/ticket-types',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  ticketingController.createTicketType
);

ticketingRouter.put(
  '/ticket-types/:id',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  ticketingController.updateTicketType
);

ticketingRouter.delete(
  '/ticket-types/:id',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  ticketingController.deleteTicketType
);

// ==========================================
// ORDERS
// ==========================================

ticketingRouter.post(
  '/orders',
  authGuard,
  ticketingController.createOrder
);

ticketingRouter.get(
  '/orders/my',
  authGuard,
  ticketingController.getMyOrders
);

ticketingRouter.get(
  '/orders/event/:eventId',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  ticketingController.getEventOrders
);

ticketingRouter.get(
  '/orders/:id',
  authGuard,
  ticketingController.getOrderById
);

ticketingRouter.get(
  '/orders',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN]),
  ticketingController.getAllOrders
);

// ==========================================
// REGISTRATIONS
// ==========================================

ticketingRouter.get(
  '/registrations/my',
  authGuard,
  ticketingController.getMyRegistrations
);

ticketingRouter.get(
  '/registrations/event/:eventId',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  ticketingController.getEventRegistrations
);

ticketingRouter.get(
  '/registrations',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  ticketingController.getAllRegistrations
);

ticketingRouter.post(
  '/registrations/:id/cancel',
  authGuard,
  ticketingController.cancelRegistration
);

// Approval workflow endpoints
ticketingRouter.post(
  '/registrations/:id/approve',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  ticketingController.approveRegistration
);

ticketingRouter.post(
  '/registrations/:id/reject',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  ticketingController.rejectRegistration
);

// ==========================================
// INVITATIONS (Invite-only events)
// ==========================================

ticketingRouter.post(
  '/events/:eventId/invite',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  ticketingController.inviteAttendee
);

ticketingRouter.get(
  '/events/:eventId/invitations',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  ticketingController.getEventInvitations
);

ticketingRouter.post(
  '/invitations/:id/revoke',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  ticketingController.revokeInvitation
);

// ==========================================
// WAITLIST
// ==========================================

ticketingRouter.post(
  '/waitlist/join',
  authGuard,
  ticketingController.joinWaitlist
);

ticketingRouter.get(
  '/waitlist/event/:eventId',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  ticketingController.getEventWaitlist
);

ticketingRouter.get(
  '/waitlist/event/:eventId/my-position',
  authGuard,
  ticketingController.getMyWaitlistPosition
);

ticketingRouter.post(
  '/waitlist/:id/leave',
  authGuard,
  ticketingController.leaveWaitlist
);

ticketingRouter.post(
  '/waitlist/:id/promote',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  ticketingController.promoteWaitlistEntry
);

// ==========================================
// QR CODE VALIDATION SYSTEM
// ==========================================

ticketingRouter.post(
  '/qr/validate',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  ticketingController.validateQrCode
);

// Fallback payment webhook routing path
ticketingRouter.post('/payments/webhooks/chapa', paymentController.handleChapaWebhook);

export default ticketingRouter;

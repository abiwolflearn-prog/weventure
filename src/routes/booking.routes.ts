import { Router } from 'express';
import { bookingController } from '../controllers/BookingController';
import { authGuard } from '../middleware/authGuard';
import { hasRoles } from '../middleware/roleGuard';
import { UserRole } from '../types';

const bookingRouter = Router();

// Retrieve list of bookings (subject to user role filters)
bookingRouter.get('/', authGuard, bookingController.list);

// Retrieve details for a single booking
bookingRouter.get('/:id', authGuard, bookingController.getById);

// Create a new booking reservation
bookingRouter.post('/', authGuard, bookingController.create);

// Cancel a booking reservation
bookingRouter.post('/:id/cancel', authGuard, bookingController.cancel);

// Approve a booking (Admin/Staff only)
bookingRouter.post(
  '/:id/approve',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  bookingController.approve
);

// Reject a booking (Admin/Staff only)
bookingRouter.post(
  '/:id/reject',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  bookingController.reject
);

// Renew a booking / agreement
bookingRouter.post(
  '/:id/renew',
  authGuard,
  bookingController.renew
);

// WeVentureHub Enterprise Workflows
bookingRouter.post(
  '/:id/generate-agreement',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  bookingController.generateAgreement
);

bookingRouter.post(
  '/:id/sign-agreement',
  authGuard,
  bookingController.signAgreement
);

bookingRouter.post(
  '/:id/generate-invoice',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  bookingController.generateInvoice
);

bookingRouter.get(
  '/:id/agreement',
  authGuard,
  bookingController.getAgreement
);

export default bookingRouter;

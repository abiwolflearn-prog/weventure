import { Router } from 'express';
import { startupController } from '../controllers/StartupController';
import { authGuard } from '../middleware/authGuard';
import { hasRoles } from '../middleware/roleGuard';
import { UserRole } from '../types';

const startupRouter = Router();

// Public routes
startupRouter.get('/programs', (req, res, next) => startupController.getPrograms(req, res, next));
startupRouter.post('/apply', (req, res, next) => startupController.submitApplication(req, res, next));

// Admin protected routes
const ADMIN_ROLES = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF];

startupRouter.get(
  '/applications',
  authGuard,
  hasRoles(ADMIN_ROLES),
  (req, res, next) => startupController.getAllApplications(req, res, next)
);

startupRouter.patch(
  '/applications/:id/status',
  authGuard,
  hasRoles(ADMIN_ROLES),
  (req, res, next) => startupController.updateApplicationStatus(req, res, next)
);

startupRouter.delete(
  '/applications/:id',
  authGuard,
  hasRoles(ADMIN_ROLES),
  (req, res, next) => startupController.deleteApplication(req, res, next)
);

startupRouter.post(
  '/programs',
  authGuard,
  hasRoles(ADMIN_ROLES),
  (req, res, next) => startupController.createProgram(req, res, next)
);

startupRouter.patch(
  '/programs/:id',
  authGuard,
  hasRoles(ADMIN_ROLES),
  (req, res, next) => startupController.updateProgram(req, res, next)
);

startupRouter.delete(
  '/programs/:id',
  authGuard,
  hasRoles(ADMIN_ROLES),
  (req, res, next) => startupController.deleteProgram(req, res, next)
);

export default startupRouter;

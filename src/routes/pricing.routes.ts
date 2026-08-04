import { Router } from 'express';
import { pricingController } from '../controllers/PricingController';
import { authGuard } from '../middleware/authGuard';
import { hasRoles } from '../middleware/roleGuard';
import { UserRole } from '../types';

const pricingRouter = Router();

// Calculate price dynamically - accessible to authenticated users
pricingRouter.post('/calculate', authGuard, pricingController.calculatePrice);

// Admin-only operations for managing pricing rules
pricingRouter.get('/', authGuard, pricingController.listRules);
pricingRouter.get('/:id', authGuard, pricingController.getRuleById);

pricingRouter.post(
  '/',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  pricingController.createRule
);

pricingRouter.put(
  '/:id',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  pricingController.updateRule
);

pricingRouter.delete(
  '/:id',
  authGuard,
  hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF]),
  pricingController.deleteRule
);

export default pricingRouter;

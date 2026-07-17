import { Router } from 'express';
import { subscriptionController } from '../controllers/SubscriptionController';
import { authGuard } from '../middleware/authGuard';

const billingRouter = Router();

// Publicly viewable standard pricing options
billingRouter.get('/plans', subscriptionController.getPlans);
billingRouter.get('/features', subscriptionController.getFeatureRegistry);

// Authenticated billing and subscription endpoints
billingRouter.use(authGuard);

billingRouter.get('/dashboard', subscriptionController.getBillingDashboard);
billingRouter.post('/subscribe', subscriptionController.subscribe);
billingRouter.post('/cancel', subscriptionController.cancel);
billingRouter.post('/renew', subscriptionController.renew);
billingRouter.get('/history', subscriptionController.getBillingHistory);

// Super-Admin level customization and plan CRUD
billingRouter.post('/plans', subscriptionController.createPlan);
billingRouter.put('/plans/:id', subscriptionController.updatePlan);
billingRouter.delete('/plans/:id', subscriptionController.deletePlan);
billingRouter.post('/tenants/:id/overrides', subscriptionController.updateFeatureOverrides);

export default billingRouter;

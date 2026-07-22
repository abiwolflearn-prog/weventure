import { Router } from 'express';
import { ApiResponse } from '../utils/response';
import { tenantContext } from '../middleware/tenantContext';
import authRouter from './auth.routes';
import tenantRouter from './tenant.routes';
import eventRouter from './event.routes';
import ticketingRouter from './ticketing.routes';
import workspaceRouter from './workspace.routes';
import bookingRouter from './booking.routes';
import paymentRouter from './payment.routes';
import billingRouter from './billing.routes';
import notificationRouter from './notification.routes';
import analyticsRouter from './analytics.routes';
import dashboardRouter from './dashboard.routes';
import reportRouter from './report.routes';
import onboardingRouter from './onboarding.routes';
import publicRouter from './public.routes';
import crmRouter from './crm.routes';
import integrationRouter from './integration.routes';
import assistantRouter from './assistant.routes';
import { emailRouter } from './email.routes';
import { cmsRouter } from './cms.routes';
import startupRouter from './startup.routes';

const apiRouter = Router();

// Mount global tenant context extraction across all API pathways
apiRouter.use(tenantContext);

// Mount public marketplace module
apiRouter.use('/public', publicRouter);

// Mount onboarding core module
apiRouter.use('/onboarding', onboardingRouter);

// Mount authentication core module
apiRouter.use('/auth', authRouter);

// Mount organizations management module
apiRouter.use('/organizations', tenantRouter);

// Mount events core module
apiRouter.use('/events', eventRouter);

// Mount ticketing & registration module
apiRouter.use('/ticketing', ticketingRouter);

// Mount workspaces module
apiRouter.use('/workspaces', workspaceRouter);

// Mount bookings module
apiRouter.use('/bookings', bookingRouter);

// Mount payment core module
apiRouter.use('/payments', paymentRouter);

// Mount subscription and billing foundation module
apiRouter.use('/billing', billingRouter);

// Mount analytics & business intelligence core
apiRouter.use('/analytics', analyticsRouter);
apiRouter.use('/dashboard', dashboardRouter);

// Mount business reporting & export center
apiRouter.use('/reports', reportRouter);

// Mount CRM & contact management core module
apiRouter.use('/crm', crmRouter);

// Mount real-time communications & notification module
apiRouter.use('/communications', notificationRouter);

// Mount enterprise integrations platform module
apiRouter.use('/integrations', integrationRouter);

// Mount WeVenture Assistant AI virtual assistant module
apiRouter.use('/assistant', assistantRouter);

// Mount automated email notification management system
apiRouter.use('/emails', emailRouter);

// Mount CMS & content management module
apiRouter.use('/cms', cmsRouter);

// Mount Startup Programs & Applications module
apiRouter.use('/startups', startupRouter);

/**
 * @route   GET /api/v1/health
 * @desc    Get service health, system statistics, and operational conditions
 * @access  Public
 */
apiRouter.get('/health', (req, res) => {
  const systemMetrics = {
    status: 'operational',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    tenantContext: req.tenantId || 'global',
    memoryUsage: process.memoryUsage(),
  };
  return ApiResponse.success(res, systemMetrics, 200, {
    message: 'WeVentureHub API Engine is healthy',
  });
});

/**
 * @route   GET /api/v1/version
 * @desc    Fetch platform metadata and version tags
 * @access  Public
 */
apiRouter.get('/version', (req, res) => {
  return ApiResponse.success(res, {
    platform: 'WeVentureHub',
    version: '1.0.0-draft',
    apiType: 'RESTful with WebSockets integration',
    license: 'Enterprise Proprietary',
  });
});

export default apiRouter;

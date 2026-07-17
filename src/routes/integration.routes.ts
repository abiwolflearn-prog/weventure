import { Router } from 'express';
import { IntegrationController } from '../controllers/IntegrationController';
import { authGuard } from '../middleware/authGuard';
import { apiKeyGuard } from '../middleware/apiKeyGuard';

const integrationRouter = Router();
const controller = new IntegrationController();

// =========================================================================
// PUBLIC OR KEY-AUTHENTICATED PATHWAYS FOR LIVE TESTING
// =========================================================================
// Incoming webhook receiver from external third party services
// (supports signature validation and async processing)
integrationRouter.post('/webhooks/events', (req, res, next) => {
  controller.handleIncomingWebhook(req, res, next);
});

// Authenticated Gateway APIs using custom Client API Keys (for live testing console!)
integrationRouter.get('/api/events', apiKeyGuard, (req, res, next) => {
  controller.getMockEvents(req, res, next);
});
integrationRouter.post('/api/events', apiKeyGuard, (req, res, next) => {
  controller.createMockEvent(req, res, next);
});
integrationRouter.get('/api/bookings', apiKeyGuard, (req, res, next) => {
  controller.getMockBookings(req, res, next);
});

// =========================================================================
// PROTECTED SAAS DASHBOARD PATHWAYS (Requires logged-in Tenant admin session)
// =========================================================================
// API Keys Configuration
integrationRouter.get('/apikeys', authGuard, (req, res, next) => {
  controller.getApiKeys(req, res, next);
});
integrationRouter.post('/apikeys', authGuard, (req, res, next) => {
  controller.createApiKey(req, res, next);
});
integrationRouter.delete('/apikeys/:id', authGuard, (req, res, next) => {
  controller.revokeApiKey(req, res, next);
});

// Webhook Subscriptions (Outbound)
integrationRouter.get('/webhooks', authGuard, (req, res, next) => {
  controller.getWebhookSubscriptions(req, res, next);
});
integrationRouter.post('/webhooks', authGuard, (req, res, next) => {
  controller.createWebhookSubscription(req, res, next);
});
integrationRouter.put('/webhooks/:id', authGuard, (req, res, next) => {
  controller.updateWebhookSubscription(req, res, next);
});
integrationRouter.delete('/webhooks/:id', authGuard, (req, res, next) => {
  controller.deleteWebhookSubscription(req, res, next);
});
integrationRouter.post('/webhooks/:id/test', authGuard, (req, res, next) => {
  controller.testWebhookSubscription(req, res, next);
});

// Delivery Logs
integrationRouter.get('/logs', authGuard, (req, res, next) => {
  controller.getDeliveryLogs(req, res, next);
});
integrationRouter.post('/logs/:id/retry', authGuard, (req, res, next) => {
  controller.retryDeliveryLog(req, res, next);
});

// Automation Engine Rules
integrationRouter.get('/rules', authGuard, (req, res, next) => {
  controller.getAutomationRules(req, res, next);
});
integrationRouter.post('/rules', authGuard, (req, res, next) => {
  controller.createAutomationRule(req, res, next);
});
integrationRouter.delete('/rules/:id', authGuard, (req, res, next) => {
  controller.deleteAutomationRule(req, res, next);
});

// Connected Apps (Marketplace integration toggle)
integrationRouter.get('/connected-apps', authGuard, (req, res, next) => {
  controller.getConnectedApps(req, res, next);
});
integrationRouter.post('/connected-apps/:appId/toggle', authGuard, (req, res, next) => {
  controller.toggleConnectedApp(req, res, next);
});

// OAuth Client Registration
integrationRouter.get('/oauth-apps', authGuard, (req, res, next) => {
  controller.getOAuthApps(req, res, next);
});
integrationRouter.post('/oauth-apps', authGuard, (req, res, next) => {
  controller.createOAuthApp(req, res, next);
});
integrationRouter.delete('/oauth-apps/:id', authGuard, (req, res, next) => {
  controller.deleteOAuthApp(req, res, next);
});

// API Performance Analytics
integrationRouter.get('/analytics', authGuard, (req, res, next) => {
  controller.getAnalytics(req, res, next);
});

export default integrationRouter;

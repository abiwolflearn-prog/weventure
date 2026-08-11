import { Router } from 'express';
import { emailController } from '../controllers/EmailController';
import { authGuard } from '../middleware/authGuard';
import { hasRoles } from '../middleware/roleGuard';
import { UserRole } from '../types';

const emailRouter = Router();

// --- CUSTOMER ENDPOINTS ---
emailRouter.get('/me/history', authGuard, (req, res, next) => {
  emailController.getMyHistory(req, res, next);
});

emailRouter.get('/me/preferences', authGuard, (req, res, next) => {
  emailController.getMyPreferences(req, res, next);
});

emailRouter.put('/me/preferences', authGuard, (req, res, next) => {
  emailController.updateMyPreferences(req, res, next);
});

emailRouter.post('/me/resend', authGuard, (req, res, next) => {
  emailController.resendCustomerEmail(req, res, next);
});

// --- ADMIN / OPERATOR ENDPOINTS ---
const ADMIN_ROLES = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF];

emailRouter.get('/admin/templates', authGuard, hasRoles(ADMIN_ROLES), (req, res, next) => {
  emailController.getTemplates(req, res, next);
});

emailRouter.put('/admin/templates/:key', authGuard, hasRoles(ADMIN_ROLES), (req, res, next) => {
  emailController.updateTemplate(req, res, next);
});

emailRouter.get('/admin/queue', authGuard, hasRoles(ADMIN_ROLES), (req, res, next) => {
  emailController.getQueue(req, res, next);
});

emailRouter.post('/admin/queue/retry', authGuard, hasRoles(ADMIN_ROLES), (req, res, next) => {
  emailController.retryQueueItem(req, res, next);
});

emailRouter.get('/admin/logs', authGuard, hasRoles(ADMIN_ROLES), (req, res, next) => {
  emailController.getLogs(req, res, next);
});

emailRouter.get('/admin/analytics', authGuard, hasRoles(ADMIN_ROLES), (req, res, next) => {
  emailController.getAnalytics(req, res, next);
});

emailRouter.get('/admin/smtp', authGuard, hasRoles(ADMIN_ROLES), (req, res, next) => {
  emailController.getSmtpStatus(req, res, next);
});

emailRouter.post('/admin/smtp/test', authGuard, hasRoles(ADMIN_ROLES), (req, res, next) => {
  emailController.testSmtp(req, res, next);
});

emailRouter.get('/admin/settings', authGuard, hasRoles(ADMIN_ROLES), (req, res, next) => {
  emailController.getSettings(req, res, next);
});

emailRouter.put('/admin/settings', authGuard, hasRoles(ADMIN_ROLES), (req, res, next) => {
  emailController.updateSettings(req, res, next);
});

emailRouter.post('/admin/logs/resend', authGuard, hasRoles(ADMIN_ROLES), (req, res, next) => {
  emailController.resendFailedLog(req, res, next);
});

export { emailRouter };

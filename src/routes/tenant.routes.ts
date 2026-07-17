import { Router } from 'express';
import { tenantController } from '../controllers/TenantController';
import { authGuard } from '../middleware/authGuard';

const tenantRouter = Router();

// All organization management pathways require authenticated sessions
tenantRouter.use(authGuard);

/**
 * @route   POST /api/v1/organizations
 * @desc    Create a new organization/tenant
 * @access  Private (Super Admin)
 */
tenantRouter.post('/', tenantController.create.bind(tenantController));

/**
 * @route   GET /api/v1/organizations
 * @desc    List and search organizations
 * @access  Private (Super Admin)
 */
tenantRouter.get('/', tenantController.list.bind(tenantController));

/**
 * @route   GET /api/v1/organizations/:id
 * @desc    Get organization details
 * @access  Private (Super Admin, Tenant Admin/Staff of that organization)
 */
tenantRouter.get('/:id', tenantController.getById.bind(tenantController));

/**
 * @route   PUT /api/v1/organizations/:id
 * @desc    Update organization name/description
 * @access  Private (Super Admin, Tenant Admin of that organization)
 */
tenantRouter.put('/:id', tenantController.update.bind(tenantController));

/**
 * @route   PUT /api/v1/organizations/:id/settings
 * @desc    Update organization localization settings (timezone, currency, language)
 * @access  Private (Super Admin, Tenant Admin of that organization)
 */
tenantRouter.put('/:id/settings', tenantController.updateSettings.bind(tenantController));

/**
 * @route   PUT /api/v1/organizations/:id/branding
 * @desc    Update organization branding (logo, colors, login layouts)
 * @access  Private (Super Admin, Tenant Admin of that organization)
 */
tenantRouter.put('/:id/branding', tenantController.updateBranding.bind(tenantController));

/**
 * @route   PUT /api/v1/organizations/:id/website
 * @desc    Update organization public website configurations
 * @access  Private (Super Admin, Tenant Admin of that organization)
 */
tenantRouter.put('/:id/website', tenantController.updateWebsite.bind(tenantController));

/**
 * @route   PUT /api/v1/organizations/:id/subscription
 * @desc    Update organization subscription and plan limits
 * @access  Private (Super Admin)
 */
tenantRouter.put('/:id/subscription', tenantController.updateSubscription.bind(tenantController));

/**
 * @route   POST /api/v1/organizations/:id/suspend
 * @desc    Suspend organization activity
 * @access  Private (Super Admin)
 */
tenantRouter.post('/:id/suspend', tenantController.suspend.bind(tenantController));

/**
 * @route   POST /api/v1/organizations/:id/restore
 * @desc    Restore organization activity
 * @access  Private (Super Admin)
 */
tenantRouter.post('/:id/restore', tenantController.restore.bind(tenantController));

/**
 * @route   DELETE /api/v1/organizations/:id
 * @desc    Soft-delete organization
 * @access  Private (Super Admin)
 */
tenantRouter.delete('/:id', tenantController.delete.bind(tenantController));

/**
 * @route   GET /api/v1/organizations/:id/audit-logs
 * @desc    Get organization activity audit logs
 * @access  Private (Super Admin, Tenant Admin of that organization)
 */
tenantRouter.get('/:id/audit-logs', tenantController.getAuditLogs.bind(tenantController));

export default tenantRouter;

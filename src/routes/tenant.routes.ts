import { Router } from 'express';
import { tenantController } from '../controllers/TenantController';
import { authGuard } from '../middleware/authGuard';
import { hasRoles } from '../middleware/roleGuard';
import { UserRole } from '../types';

const tenantRouter = Router();

// All organization management pathways require authenticated sessions with Administrative roles
tenantRouter.use(authGuard);
tenantRouter.use(hasRoles([UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN]));

/**
 * @route   POST /api/v1/organizations
 * @desc    Create a new organization/tenant
 * @access  Private (Super Admin)
 */
tenantRouter.post('/', hasRoles([UserRole.SUPER_ADMIN]), tenantController.create.bind(tenantController));

/**
 * @route   GET /api/v1/organizations
 * @desc    List and search organizations
 * @access  Private (Super Admin, Tenant Admin)
 */
tenantRouter.get('/', tenantController.list.bind(tenantController));

/**
 * @route   GET /api/v1/organizations/:id
 * @desc    Get organization details
 * @access  Private (Super Admin, Tenant Admin)
 */
tenantRouter.get('/:id', tenantController.getById.bind(tenantController));

/**
 * @route   PUT /api/v1/organizations/:id
 * @desc    Update organization name/description
 * @access  Private (Super Admin, Tenant Admin)
 */
tenantRouter.put('/:id', tenantController.update.bind(tenantController));

/**
 * @route   PUT /api/v1/organizations/:id/settings
 * @desc    Update organization localization settings (timezone, currency, language)
 * @access  Private (Super Admin, Tenant Admin)
 */
tenantRouter.put('/:id/settings', tenantController.updateSettings.bind(tenantController));

/**
 * @route   PUT /api/v1/organizations/:id/branding
 * @desc    Update organization branding (logo, colors, login layouts)
 * @access  Private (Super Admin, Tenant Admin)
 */
tenantRouter.put('/:id/branding', tenantController.updateBranding.bind(tenantController));

/**
 * @route   PUT /api/v1/organizations/:id/website
 * @desc    Update organization public website configurations
 * @access  Private (Super Admin, Tenant Admin)
 */
tenantRouter.put('/:id/website', tenantController.updateWebsite.bind(tenantController));

/**
 * @route   PUT /api/v1/organizations/:id/subscription
 * @desc    Update organization subscription and plan limits
 * @access  Private (Super Admin)
 */
tenantRouter.put('/:id/subscription', hasRoles([UserRole.SUPER_ADMIN]), tenantController.updateSubscription.bind(tenantController));

/**
 * @route   POST /api/v1/organizations/:id/suspend
 * @desc    Suspend organization activity
 * @access  Private (Super Admin)
 */
tenantRouter.post('/:id/suspend', hasRoles([UserRole.SUPER_ADMIN]), tenantController.suspend.bind(tenantController));

/**
 * @route   POST /api/v1/organizations/:id/restore
 * @desc    Restore organization activity
 * @access  Private (Super Admin)
 */
tenantRouter.post('/:id/restore', hasRoles([UserRole.SUPER_ADMIN]), tenantController.restore.bind(tenantController));

/**
 * @route   DELETE /api/v1/organizations/:id
 * @desc    Soft-delete organization
 * @access  Private (Super Admin)
 */
tenantRouter.delete('/:id', hasRoles([UserRole.SUPER_ADMIN]), tenantController.delete.bind(tenantController));

/**
 * @route   GET /api/v1/organizations/:id/audit-logs
 * @desc    Get organization activity audit logs
 * @access  Private (Super Admin, Tenant Admin)
 */
tenantRouter.get('/:id/audit-logs', tenantController.getAuditLogs.bind(tenantController));

export default tenantRouter;

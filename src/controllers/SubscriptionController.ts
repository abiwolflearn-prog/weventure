import { Request, Response, NextFunction } from 'express';
import { subscriptionService } from '../services/SubscriptionService';
import { FEATURE_REGISTRY } from '../utils/featureRegistry';
import { Invoice } from '../models/Invoice';
import { Tenant } from '../models/Tenant';
import { ApiResponse } from '../utils/response';
import { UnauthorizedError, ForbiddenError, ValidationError, NotFoundError } from '../errors/AppError';
import { UserRole } from '../types';

export class SubscriptionController {
  /**
   * Helper to verify administrative permissions
   */
  private checkAdmin(req: Request, tenantId?: string): void {
    if (!req.user) {
      throw new UnauthorizedError('Authentication session required');
    }
    if (req.user.role === UserRole.SUPER_ADMIN) {
      return;
    }
    if (tenantId && req.user.tenantId !== tenantId) {
      throw new ForbiddenError('Access denied: Unauthorized tenant space');
    }
    if (req.user.role !== UserRole.TENANT_ADMIN) {
      throw new ForbiddenError('Administrative permissions required');
    }
  }

  /**
   * Get all pricing plans
   */
  public async getPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || req.user?.tenantId || 'weventurehub';
      const plans = await subscriptionService.getPlans(tenantId);
      ApiResponse.success(res, plans, 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create custom or standard plan (Super Admin only)
   */
  public async createPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.checkAdmin(req);
      if (req.user?.role !== UserRole.SUPER_ADMIN) {
        req.body.isCustom = true;
        req.body.tenantId = req.user?.tenantId;
      }
      const plan = await subscriptionService.createPlan(req.body);
      ApiResponse.success(res, plan, 201, { message: 'Plan created successfully' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update plan
   */
  public async updatePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      this.checkAdmin(req);
      const plan = await subscriptionService.updatePlan(id, req.body);
      ApiResponse.success(res, plan, 200, { message: 'Plan updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete plan
   */
  public async deletePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      this.checkAdmin(req);
      await subscriptionService.deletePlan(id);
      ApiResponse.success(res, null, 200, { message: 'Plan deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieve billing statistics, usage details, active features, limits
   */
  public async getBillingDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || req.user?.tenantId;
      if (!tenantId) {
        throw new ValidationError('Tenant ID is required');
      }

      const tenant = await Tenant.findById(tenantId).exec();
      if (!tenant) {
        throw new NotFoundError(`Tenant '${tenantId}' not found`);
      }

      // Sync counts to ensure absolute precision
      const usage = await subscriptionService.syncUsageCounts(tenantId);

      // Resolve all feature flags for dashboard display
      const resolvedFeatureFlags: Record<string, boolean> = {};
      for (const def of FEATURE_REGISTRY) {
        resolvedFeatureFlags[def.key] = await subscriptionService.checkFeatureAccess(tenantId, def.key);
      }

      const gracePeriodDays = 7;
      const isExpired = new Date() > new Date(tenant.subscription.expiresAt);
      const gracePeriodExpires = new Date(tenant.subscription.expiresAt);
      gracePeriodExpires.setDate(gracePeriodExpires.getDate() + gracePeriodDays);
      const isWithinGracePeriod = isExpired && new Date() <= gracePeriodExpires;

      const dashboardData = {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          settings: tenant.settings,
        },
        subscription: {
          plan: tenant.subscription.plan,
          isTrial: tenant.subscription.isTrial,
          expiresAt: tenant.subscription.expiresAt,
          isExpired,
          isWithinGracePeriod,
          gracePeriodDaysLeft: isWithinGracePeriod ? Math.max(0, Math.ceil((gracePeriodExpires.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0,
          limits: tenant.subscription.limits,
          customFeatureFlags: tenant.subscription.featureFlags || {},
          resolvedFeatureFlags,
        },
        usage: {
          workspacesCount: usage.workspacesCount,
          eventsCount: usage.eventsCount,
          usersCount: usage.usersCount,
          storageUsageMB: usage.storageUsageMB,
          apiUsageCount: usage.apiUsageCount,
          billingCycleStart: usage.billingCycleStart,
          billingCycleEnd: usage.billingCycleEnd,
        }
      };

      ApiResponse.success(res, dashboardData, 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Upgrade / Change Subscription plan
   */
  public async subscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || req.user?.tenantId;
      if (!tenantId) {
        throw new ValidationError('Tenant identification required');
      }
      this.checkAdmin(req, tenantId);

      const { planId, billingInterval } = req.body;
      if (!planId || !billingInterval) {
        throw new ValidationError('Plan ID and Billing Interval are required');
      }

      const userDetail = {
        id: req.user!.id,
        email: req.user!.email,
        name: `${req.user!.firstName} ${req.user!.lastName}`.trim(),
      };

      const result = await subscriptionService.changeTenantSubscription(
        tenantId,
        planId,
        billingInterval,
        userDetail
      );

      ApiResponse.success(res, result, 200, {
        message: `Subscription successfully updated to ${planId}`,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cancel Subscription
   */
  public async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || req.user?.tenantId;
      if (!tenantId) {
        throw new ValidationError('Tenant identification required');
      }
      this.checkAdmin(req, tenantId);

      const user = { id: req.user!.id, email: req.user!.email };
      const updatedTenant = await subscriptionService.cancelSubscription(tenantId, user);

      ApiResponse.success(res, updatedTenant, 200, {
        message: 'Subscription cancelled and plan reset to Free tier successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Renew Subscription
   */
  public async renew(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || req.user?.tenantId;
      if (!tenantId) {
        throw new ValidationError('Tenant identification required');
      }
      this.checkAdmin(req, tenantId);

      const userDetail = {
        id: req.user!.id,
        email: req.user!.email,
        name: `${req.user!.firstName} ${req.user!.lastName}`.trim(),
      };

      const result = await subscriptionService.renewSubscription(tenantId, userDetail);
      ApiResponse.success(res, result, 200, {
        message: 'Subscription successfully renewed for another cycle',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Save custom feature flag overrides (Super Admin only or custom setup)
   */
  public async updateFeatureOverrides(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params; // Tenant ID
      this.checkAdmin(req); // Checks if Super admin or high admin
      if (req.user?.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenError('Only Super Admins can update absolute feature overrides');
      }

      const { overrides } = req.body;
      if (!overrides || typeof overrides !== 'object') {
        throw new ValidationError('Feature overrides object is required');
      }

      const tenant = await subscriptionService.updateFeatureOverrides(id, overrides);
      ApiResponse.success(res, tenant, 200, {
        message: 'Tenant feature flag custom overrides applied successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieve invoice / billing histories
   */
  public async getBillingHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || req.user?.tenantId;
      if (!tenantId) {
        throw new ValidationError('Tenant context is required');
      }

      const invoices = await Invoice.find({ tenantId }).sort({ createdAt: -1 }).exec();
      ApiResponse.success(res, invoices, 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Fetch global feature registry definitions
   */
  public async getFeatureRegistry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      ApiResponse.success(res, FEATURE_REGISTRY, 200);
    } catch (err) {
      next(err);
    }
  }
}

export const subscriptionController = new SubscriptionController();

import { Tenant } from '../models/Tenant';
import { Plan, IPlanDocument } from '../models/Plan';
import { TenantUsage, ITenantUsageDocument } from '../models/TenantUsage';
import { Invoice, InvoiceStatus } from '../models/Invoice';
import { Workspace } from '../models/Workspace';
import { Event } from '../models/Event';
import { logger } from '../utils/logger';
import { ValidationError, NotFoundError } from '../errors/AppError';
import { SubscriptionPlan } from '../types';

export class SubscriptionService {
  /**
   * Seed standard workspace & event plans if they don't already exist
   */
  public async seedDefaultPlans(): Promise<void> {
    try {
      const planCount = await Plan.countDocuments();
      if (planCount === 0) {
        logger.info('🌱 Bootstrap: Creating standard enterprise SaaS plans...');
        
        const standardPlans = [
          {
            _id: 'free',
            name: 'Free Trial Starter',
            description: 'Perfect for small teams and workspace test drives.',
            priceMonthly: 0,
            priceYearly: 0,
            limits: {
              maxWorkspaces: 2,
              maxEvents: 5,
              maxUsers: 5,
              maxStorageMB: 100,
              maxApiRequests: 1000,
            },
            featureFlags: {
              enableAdvancedAnalytics: false,
              enableAPIIntegrations: false,
              enableCustomDomain: false,
              enableBulkRegistration: false,
              enablePrioritySupport: false,
              enableCustomTeaming: false,
            },
            isCustom: false,
          },
          {
            _id: 'growth',
            name: 'Professional Growth',
            description: 'Scale your community hubs with premium booking and analytics.',
            priceMonthly: 49,
            priceYearly: 470,
            limits: {
              maxWorkspaces: 10,
              maxEvents: 50,
              maxUsers: 25,
              maxStorageMB: 5120, // 5GB
              maxApiRequests: 50000,
            },
            featureFlags: {
              enableAdvancedAnalytics: true,
              enableAPIIntegrations: false,
              enableCustomDomain: false,
              enableBulkRegistration: true,
              enablePrioritySupport: false,
              enableCustomTeaming: false,
            },
            isCustom: false,
          },
          {
            _id: 'enterprise',
            name: 'Enterprise Executive',
            description: 'Unlimited capacities, complete custom white-label branding, and dedicated SLA.',
            priceMonthly: 199,
            priceYearly: 1900,
            limits: {
              maxWorkspaces: 100,
              maxEvents: 500,
              maxUsers: 1000,
              maxStorageMB: 102400, // 100GB
              maxApiRequests: 1000000,
            },
            featureFlags: {
              enableAdvancedAnalytics: true,
              enableAPIIntegrations: true,
              enableCustomDomain: true,
              enableBulkRegistration: true,
              enablePrioritySupport: true,
              enableCustomTeaming: true,
            },
            isCustom: false,
          }
        ];

        await Plan.insertMany(standardPlans);
        logger.info('🌱 Bootstrap: Standard pricing plans populated successfully.');
      }
    } catch (err) {
      logger.error('❌ Bootstrap: Error seeding standard plans', err);
    }
  }

  /**
   * Retrieve active plans list
   */
  public async getPlans(tenantId?: string): Promise<IPlanDocument[]> {
    const query: any = {
      $or: [
        { isCustom: false },
        { isCustom: true, tenantId }
      ]
    };
    return await Plan.find(query).exec();
  }

  /**
   * Plan CRUD: Create Plan
   */
  public async createPlan(data: any): Promise<IPlanDocument> {
    if (!data.id || !data.name) {
      throw new ValidationError('Plan unique ID and Name are required');
    }
    const slug = data.id.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const existing = await Plan.findById(slug);
    if (existing) {
      throw new ValidationError(`Plan with key '${slug}' already exists`);
    }

    const plan = new Plan({
      _id: slug,
      ...data,
    });
    return await plan.save();
  }

  /**
   * Plan CRUD: Update Plan
   */
  public async updatePlan(id: string, data: any): Promise<IPlanDocument> {
    const plan = await Plan.findById(id);
    if (!plan) {
      throw new NotFoundError(`Plan '${id}' not found`);
    }

    if (data.name !== undefined) plan.name = data.name;
    if (data.description !== undefined) plan.description = data.description;
    if (data.priceMonthly !== undefined) plan.priceMonthly = data.priceMonthly;
    if (data.priceYearly !== undefined) plan.priceYearly = data.priceYearly;
    if (data.limits !== undefined) {
      plan.limits = { ...plan.limits, ...data.limits };
    }
    if (data.featureFlags !== undefined) {
      plan.featureFlags = data.featureFlags;
    }

    return await plan.save();
  }

  /**
   * Plan CRUD: Delete Plan
   */
  public async deletePlan(id: string): Promise<void> {
    const plan = await Plan.findById(id);
    if (!plan) {
      throw new NotFoundError(`Plan '${id}' not found`);
    }
    if (!plan.isCustom && ['free', 'growth', 'enterprise'].includes(id)) {
      throw new ValidationError('Deleting base platform standard plans is prohibited');
    }
    await Plan.findByIdAndDelete(id).exec();
  }

  /**
   * Get or initialize real-time usage metrics for a specific tenant
   */
  public async getTenantUsage(tenantId: string): Promise<ITenantUsageDocument> {
    let usage = await TenantUsage.findOne({ tenantId }).exec();
    if (!usage) {
      // Lazy init of tenant usage
      usage = new TenantUsage({
        tenantId,
        workspacesCount: 0,
        eventsCount: 0,
        usersCount: 0,
        storageUsageMB: 0,
        apiUsageCount: 0,
      });
      await usage.save();
    }
    return usage;
  }

  /**
   * Synchronize usage statistics directly from active MongoDB collections
   */
  public async syncUsageCounts(tenantId: string): Promise<ITenantUsageDocument> {
    const usage = await this.getTenantUsage(tenantId);

    // 1. Count workspaces
    const workspacesCount = await Workspace.countDocuments({ tenantId }).exec();

    // 2. Count events
    const eventsCount = await Event.countDocuments({ tenantId }).exec();

    // 3. Count user list
    // Note: If you don't have a global User model, we'll try to find a safe count or stick with mongoose counts
    let usersCount = 5; // default simulated/existing count fallback
    try {
      const User = mongoose.model('User');
      if (User) {
        usersCount = await User.countDocuments({ tenantId }).exec();
      }
    } catch {
      // User model might not be registered yet or not found
    }

    usage.workspacesCount = workspacesCount;
    usage.eventsCount = eventsCount;
    usage.usersCount = usersCount;

    return await usage.save();
  }

  /**
   * Increment specific usage metrics safely
   */
  public async incrementUsage(tenantId: string, metric: keyof ITenantUsageDocument, amount: number = 1): Promise<ITenantUsageDocument> {
    const usage = await this.getTenantUsage(tenantId);
    if (typeof usage[metric] === 'number') {
      (usage[metric] as number) += amount;
    }
    return await usage.save();
  }

  /**
   * Check if a specific limit is exceeded
   */
  public async checkLimitExceeded(tenantId: string, limitKey: 'maxWorkspaces' | 'maxEvents' | 'maxUsers' | 'maxStorageMB' | 'maxApiRequests', currentVal: number): Promise<{ exceeded: boolean; limit: number }> {
    const tenant = await Tenant.findById(tenantId).exec();
    if (!tenant) {
      throw new NotFoundError(`Tenant '${tenantId}' not found`);
    }

    const maxVal = tenant.subscription.limits[limitKey as any] || 0;
    return {
      exceeded: currentVal > maxVal,
      limit: maxVal,
    };
  }

  /**
   * Resolves feature flags dynamically, incorporating plan defaults and tenant-specific overrides
   */
  public async checkFeatureAccess(tenantId: string, featureKey: string): Promise<boolean> {
    const tenant = await Tenant.findById(tenantId).exec();
    if (!tenant) return false;

    // 1. Check for manual admin override first
    const overrides = tenant.subscription.featureFlags as any;
    if (overrides && typeof overrides.get === 'function') {
      const overrideVal = overrides.get(featureKey);
      if (overrideVal !== undefined) {
        return !!overrideVal;
      }
    } else if (overrides && typeof overrides === 'object' && featureKey in overrides) {
      return !!overrides[featureKey];
    }

    // 2. Fallback to active standard plan default flags
    const activePlanId = tenant.subscription.plan.toLowerCase();
    const plan = await Plan.findById(activePlanId).exec();
    if (!plan) return false;

    return !!plan.featureFlags[featureKey];
  }

  /**
   * Process a plan subscription, upgrade, or downgrade
   */
  public async changeTenantSubscription(
    tenantId: string,
    planId: string,
    billingInterval: 'monthly' | 'yearly',
    user: { id: string; email: string; name: string }
  ): Promise<{ tenant: any; invoice: any }> {
    const tenant = await Tenant.findById(tenantId).exec();
    if (!tenant) {
      throw new NotFoundError(`Tenant '${tenantId}' not found`);
    }

    const plan = await Plan.findById(planId.toLowerCase()).exec();
    if (!plan) {
      throw new ValidationError(`Selected subscription plan '${planId}' does not exist`);
    }

    // Standard business validations for downgrades
    const usage = await this.syncUsageCounts(tenantId);
    if (usage.workspacesCount > plan.limits.maxWorkspaces) {
      throw new ValidationError(`Cannot switch to ${plan.name}. Current workspaces (${usage.workspacesCount}) exceed plan limit of ${plan.limits.maxWorkspaces}.`);
    }
    if (usage.eventsCount > plan.limits.maxEvents) {
      throw new ValidationError(`Cannot switch to ${plan.name}. Current events (${usage.eventsCount}) exceed plan limit of ${plan.limits.maxEvents}.`);
    }
    if (usage.usersCount > plan.limits.maxUsers) {
      throw new ValidationError(`Cannot switch to ${plan.name}. Current users (${usage.usersCount}) exceed plan limit of ${plan.limits.maxUsers}.`);
    }

    // Map subscription plan type
    let mappedPlan: SubscriptionPlan = SubscriptionPlan.FREE;
    if (plan._id === 'growth') mappedPlan = SubscriptionPlan.GROWTH;
    if (plan._id === 'enterprise') mappedPlan = SubscriptionPlan.ENTERPRISE;

    // Compute cycle expiration
    const expiresAt = new Date();
    if (billingInterval === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    // Record invoice
    const price = billingInterval === 'yearly' ? plan.priceYearly : plan.priceMonthly;
    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newInvoice = new Invoice({
      tenantId,
      userId: user.id,
      userEmail: user.email,
      invoiceNumber,
      amount: price,
      currency: tenant.settings.currency || 'USD',
      status: price > 0 ? InvoiceStatus.PAID : InvoiceStatus.PAID, // Treat immediately paid for simplicity
      billingDetails: {
        name: user.name || user.email.split('@')[0],
        email: user.email,
      },
      lineItems: [
        {
          description: `Subscription to plan: ${plan.name} (${billingInterval} billing)`,
          quantity: 1,
          unitPrice: price,
          amount: price,
        }
      ],
      dueDate: new Date(),
      paidAt: new Date(),
    });

    const invoice = await newInvoice.save();

    // Apply new subscription settings to tenant
    tenant.subscription = {
      plan: mappedPlan,
      isTrial: false,
      expiresAt,
      limits: {
        maxWorkspaces: plan.limits.maxWorkspaces,
        maxEvents: plan.limits.maxEvents,
        maxUsers: plan.limits.maxUsers,
      },
      // Keep old feature flag overrides, but merge
      featureFlags: tenant.subscription.featureFlags || new Map(),
    };

    // Update current billing cycle start / end dates on usage
    usage.billingCycleStart = new Date();
    usage.billingCycleEnd = expiresAt;
    await usage.save();

    const updatedTenant = await tenant.save();

    // Log the action
    try {
      const TenantAuditLog = mongoose.model('TenantAuditLog') as any;
      const audit = new TenantAuditLog({
        tenantId,
        userId: user.id,
        userEmail: user.email,
        action: 'SUBSCRIPTION_UPGRADE',
        timestamp: new Date(),
        details: {
          previousPlan: tenant.subscription?.plan,
          newPlan: mappedPlan,
          interval: billingInterval,
          invoiceId: invoice.id,
        },
      });
      await audit.save();
    } catch (err) {
      logger.error('Failed to write audit logs for subscription upgrade', err);
    }

    return { tenant: updatedTenant, invoice };
  }

  /**
   * Cancel subscription (turn off auto-renew or record cancel intent)
   */
  public async cancelSubscription(tenantId: string, user: { id: string; email: string }): Promise<any> {
    const tenant = await Tenant.findById(tenantId).exec();
    if (!tenant) {
      throw new NotFoundError(`Tenant '${tenantId}' not found`);
    }

    // In this multi-tenant starter, we mock cancellation by marking as FREE or putting a flag.
    // Let's set a trial status or grace period, or log a cancellation audit
    try {
      const TenantAuditLog = mongoose.model('TenantAuditLog') as any;
      const audit = new TenantAuditLog({
        tenantId,
        userId: user.id,
        userEmail: user.email,
        action: 'SUBSCRIPTION_CANCEL',
        timestamp: new Date(),
        details: { plan: tenant.subscription.plan },
      });
      await audit.save();
    } catch {}

    // Downgrade tenant to Free Plan upon cycle completion is standard.
    // For immediate experience in this playground, we let them cancel and immediately reset to FREE.
    tenant.subscription.plan = SubscriptionPlan.FREE;
    tenant.subscription.isTrial = false;
    // reset standard Free limits
    tenant.subscription.limits = {
      maxWorkspaces: 2,
      maxEvents: 5,
      maxUsers: 5,
    };

    return await tenant.save();
  }

  /**
   * Renew Subscription
   */
  public async renewSubscription(tenantId: string, user: { id: string; email: string; name: string }): Promise<any> {
    const tenant = await Tenant.findById(tenantId).exec();
    if (!tenant) {
      throw new NotFoundError(`Tenant '${tenantId}' not found`);
    }

    const activePlanId = tenant.subscription.plan.toLowerCase();
    return await this.changeTenantSubscription(tenantId, activePlanId, 'monthly', user);
  }

  /**
   * Apply tenant-specific feature overrides
   */
  public async updateFeatureOverrides(tenantId: string, featureOverrides: Record<string, boolean>): Promise<any> {
    const tenant = await Tenant.findById(tenantId).exec();
    if (!tenant) {
      throw new NotFoundError(`Tenant '${tenantId}' not found`);
    }

    // Update map
    const map = new Map<string, boolean>();
    Object.entries(featureOverrides).forEach(([key, val]) => {
      map.set(key, val);
    });

    tenant.subscription.featureFlags = map;
    return await tenant.save();
  }
}

import mongoose from 'mongoose';
export const subscriptionService = new SubscriptionService();

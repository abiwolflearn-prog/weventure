import { tenantRepository, ITenantFilters, IPaginatedTenants } from '../repositories/TenantRepository';
import { ITenantDocument } from '../models/Tenant';
import { ITenantAuditLogDocument } from '../models/TenantAuditLog';
import { TenantStatus, SubscriptionPlan, IUserIdentity } from '../types';
import { ValidationError, NotFoundError, UnauthorizedError } from '../errors/AppError';
import { logger } from '../utils/logger';

export class TenantService {
  /**
   * Helper to write administrative audit log entry
   */
  private async logTenantAction(
    tenantId: string,
    user: IUserIdentity,
    action: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    try {
      await tenantRepository.createAuditLog({
        tenantId,
        userId: user.id,
        userEmail: user.email,
        action,
        details,
      });
    } catch (err) {
      logger.error(`Failed to create tenant audit log for action: ${action}`, err);
    }
  }

  /**
   * Create new organization/tenant
   */
  public async createTenant(data: any, user: IUserIdentity): Promise<ITenantDocument> {
    if (!data.id || !data.name) {
      throw new ValidationError('Tenant ID (slug) and Name are required fields');
    }

    // ID must be lowercased alphanumeric/hyphens slug
    const idSlug = data.id.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!idSlug) {
      throw new ValidationError('Invalid Tenant ID slug. Must be alphanumeric and hyphens');
    }

    // Check if tenant already exists
    const existing = await tenantRepository.findById(idSlug);
    if (existing) {
      throw new ValidationError(`Tenant with slug '${idSlug}' already exists`);
    }

    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 14); // 14-day trial default

    const payload = {
      id: idSlug,
      name: data.name,
      description: data.description || '',
      status: TenantStatus.ACTIVE,
      settings: {
        language: data.settings?.language || 'en',
        timezone: data.settings?.timezone || 'UTC',
        currency: data.settings?.currency || 'USD',
      },
      branding: {
        logoUrl: data.branding?.logoUrl || '',
        faviconUrl: data.branding?.faviconUrl || '',
        primaryColor: data.branding?.primaryColor || '#0284c7',
        secondaryColor: data.branding?.secondaryColor || '#0f172a',
        themeMode: data.branding?.themeMode || 'light',
        emailBranding: {
          headerColor: data.branding?.emailBranding?.headerColor || '#0284c7',
          footerText: data.branding?.emailBranding?.footerText || '© WeVentureHub. All rights reserved.',
          supportEmail: data.branding?.emailBranding?.supportEmail || 'support@weventurehub.com',
        },
        loginBranding: {
          title: data.branding?.loginBranding?.title || data.name,
          subtitle: data.branding?.loginBranding?.subtitle || 'Enterprise Portal',
          backgroundImageUrl: data.branding?.loginBranding?.backgroundImageUrl || '',
        },
      },
      subscription: {
        plan: data.subscription?.plan || SubscriptionPlan.FREE,
        isTrial: data.subscription?.isTrial !== undefined ? !!data.subscription.isTrial : true,
        expiresAt: data.subscription?.expiresAt ? new Date(data.subscription.expiresAt) : defaultExpiry,
        limits: {
          maxWorkspaces: data.subscription?.limits?.maxWorkspaces || 5,
          maxEvents: data.subscription?.limits?.maxEvents || 10,
          maxUsers: data.subscription?.limits?.maxUsers || 10,
        },
        featureFlags: data.subscription?.featureFlags || {},
      },
    };

    const tenant = await tenantRepository.create(payload);
    await this.logTenantAction(tenant.id, user, 'TENANT_CREATE', { name: tenant.name, plan: tenant.subscription.plan });
    return tenant;
  }

  /**
   * Get single organization details
   */
  public async getTenantById(id: string): Promise<ITenantDocument> {
    const tenant = await tenantRepository.findById(id);
    if (!tenant) {
      throw new NotFoundError(`Organization with slug '${id}' not found`);
    }
    return tenant;
  }

  /**
   * Update organization core profile
   */
  public async updateTenant(id: string, updateData: any, user: IUserIdentity): Promise<ITenantDocument> {
    const tenant = await this.getTenantById(id);

    const payload: Partial<any> = {};
    if (updateData.name !== undefined) payload.name = updateData.name;
    if (updateData.description !== undefined) payload.description = updateData.description;

    const updated = await tenantRepository.update(id, payload);
    if (!updated) {
      throw new NotFoundError('Organization update failed');
    }

    await this.logTenantAction(id, user, 'TENANT_UPDATE', { changedFields: Object.keys(payload) });
    return updated;
  }

  /**
   * Update localization settings
   */
  public async updateTenantSettings(id: string, settingsData: any, user: IUserIdentity): Promise<ITenantDocument> {
    const tenant = await this.getTenantById(id);

    const payload = {
      'settings.language': settingsData.language || tenant.settings.language,
      'settings.timezone': settingsData.timezone || tenant.settings.timezone,
      'settings.currency': settingsData.currency || tenant.settings.currency,
    };

    const updated = await tenantRepository.update(id, payload);
    if (!updated) {
      throw new NotFoundError('Organization settings update failed');
    }

    await this.logTenantAction(id, user, 'SETTINGS_UPDATE', settingsData);
    return updated;
  }

  /**
   * Update organization branding
   */
  public async updateTenantBranding(id: string, brandingData: any, user: IUserIdentity): Promise<ITenantDocument> {
    const tenant = await this.getTenantById(id);

    // Dynamic merge of high-level and deep-nested branding settings
    tenant.branding = {
      ...tenant.branding,
      ...brandingData,
      emailBranding: {
        ...tenant.branding.emailBranding,
        ...brandingData.emailBranding,
      },
      loginBranding: {
        ...tenant.branding.loginBranding,
        ...brandingData.loginBranding,
      },
      semanticColors: {
        ...(tenant.branding.semanticColors || {
          success: '#10b981',
          warning: '#f59e0b',
          info: '#3b82f6',
          danger: '#ef4444'
        }),
        ...(brandingData.semanticColors || {}),
      },
      lightTheme: {
        ...(tenant.branding.lightTheme || {
          background: '#f8fafc',
          cardBackground: '#ffffff',
          text: '#0f172a',
          border: '#e2e8f0'
        }),
        ...(brandingData.lightTheme || {}),
      },
      darkTheme: {
        ...(tenant.branding.darkTheme || {
          background: '#0f172a',
          cardBackground: '#1e293b',
          text: '#f8fafc',
          border: '#334155'
        }),
        ...(brandingData.darkTheme || {}),
      },
      dashboardBranding: {
        ...(tenant.branding.dashboardBranding || {
          sidebarMode: 'light',
          brandTitle: '',
          logoHeight: 32,
          showPoweredBy: true
        }),
        ...(brandingData.dashboardBranding || {}),
      },
      loadingScreen: {
        ...(tenant.branding.loadingScreen || {
          loadingText: 'Loading your experience...',
          spinnerStyle: 'classic',
          fadeDuration: 300
        }),
        ...(brandingData.loadingScreen || {}),
      },
      typography: {
        ...(tenant.branding.typography || {
          fontFamily: 'Inter',
          fontSizeScale: 'standard',
          borderRadius: 'lg'
        }),
        ...(brandingData.typography || {}),
      },
      pdfBranding: {
        ...(tenant.branding.pdfBranding || {
          invoiceHeaderLogoUrl: '',
          invoicePrimaryColor: '#0284c7',
          invoiceNotes: 'Thank you for your business. For any invoice queries, contact accounting.',
          invoiceSignatureUrl: '',
          bankTransferDetails: 'Acme bank transfers',
          certificateBorderColor: '#0284c7',
          certificateSignatureUrl: '',
          certificateLogoUrl: '',
          certificateTitle: 'Certificate of Achievement',
          certificateBackgroundPattern: 'classic',
          reportCoverLogoUrl: '',
          reportHeaderColor: '#0f172a',
          reportFooterPageNumbering: true,
          reportConfidentialityLabel: 'CONFIDENTIAL'
        }),
        ...(brandingData.pdfBranding || {}),
      },
    };

    // If tenantRepository update is expected, call it or save the document directly
    const updated = await tenantRepository.update(id, { branding: tenant.branding });
    if (!updated) {
      throw new NotFoundError('Organization branding update failed');
    }

    await this.logTenantAction(id, user, 'BRANDING_UPDATE', brandingData);
    return updated;
  }

  /**
   * Update organization website configurations
   */
  public async updateTenantWebsite(id: string, websiteData: any, user: IUserIdentity): Promise<ITenantDocument> {
    const tenant = await this.getTenantById(id);

    tenant.website = {
      ...(tenant.website || {
        enabled: true,
        hero: {
          title: 'Custom Tailored Workspace & Events Hub',
          subtitle: 'Establish, coordinate, and host premium workspace boards and interactive user experiences.',
          backgroundImageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200',
          ctaText: 'Explore Experiences',
          ctaLink: '#events'
        },
        about: {
          title: 'Our Narrative',
          description: 'We are committed to delivering outstanding workspace bookings and event management solutions tailored to ambitious operations.',
          foundingYear: 2024,
          highlights: ['Tailored boardrooms', 'High-speed fiber web', 'Active workshops', 'Professional hospitality']
        },
        team: [],
        gallery: [],
        testimonials: [],
        seo: {
          metaTitle: 'Custom Tailored Workspace & Event Platform',
          metaDescription: 'Schedule boardrooms and explore upcoming conferences with our high-end booking directory.',
          metaKeywords: ['workspace', 'boardroom', 'meetups', 'tickets'],
          ogImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200'
        },
        analytics: {
          googleAnalyticsId: '',
          pixelId: '',
          customScript: ''
        }
      }),
      ...websiteData,
    };

    const updated = await tenantRepository.update(id, { website: tenant.website });
    if (!updated) {
      throw new NotFoundError('Organization website update failed');
    }

    await this.logTenantAction(id, user, 'WEBSITE_UPDATE', { enabled: tenant.website.enabled });
    return updated;
  }

  /**
   * Update subscription details
   */
  public async updateTenantSubscription(id: string, subscriptionData: any, user: IUserIdentity): Promise<ITenantDocument> {
    const tenant = await this.getTenantById(id);

    const payload = {
      'subscription.plan': subscriptionData.plan || tenant.subscription.plan,
      'subscription.isTrial': subscriptionData.isTrial !== undefined ? !!subscriptionData.isTrial : tenant.subscription.isTrial,
      'subscription.expiresAt': subscriptionData.expiresAt ? new Date(subscriptionData.expiresAt) : tenant.subscription.expiresAt,
      'subscription.limits.maxWorkspaces': subscriptionData.limits?.maxWorkspaces !== undefined ? Number(subscriptionData.limits.maxWorkspaces) : tenant.subscription.limits.maxWorkspaces,
      'subscription.limits.maxEvents': subscriptionData.limits?.maxEvents !== undefined ? Number(subscriptionData.limits.maxEvents) : tenant.subscription.limits.maxEvents,
      'subscription.limits.maxUsers': subscriptionData.limits?.maxUsers !== undefined ? Number(subscriptionData.limits.maxUsers) : tenant.subscription.limits.maxUsers,
      'subscription.featureFlags': subscriptionData.featureFlags || tenant.subscription.featureFlags,
    };

    const updated = await tenantRepository.update(id, payload);
    if (!updated) {
      throw new NotFoundError('Organization subscription update failed');
    }

    await this.logTenantAction(id, user, 'SUBSCRIPTION_UPDATE', { plan: payload['subscription.plan'] });
    return updated;
  }

  /**
   * Suspend tenant
   */
  public async suspendTenant(id: string, user: IUserIdentity): Promise<ITenantDocument> {
    const updated = await tenantRepository.setStatus(id, TenantStatus.SUSPENDED);
    if (!updated) {
      throw new NotFoundError(`Tenant '${id}' not found`);
    }
    await this.logTenantAction(id, user, 'TENANT_SUSPEND', { status: TenantStatus.SUSPENDED });
    return updated;
  }

  /**
   * Restore tenant to active status
   */
  public async restoreTenant(id: string, user: IUserIdentity): Promise<ITenantDocument> {
    const updated = await tenantRepository.setStatus(id, TenantStatus.ACTIVE);
    if (!updated) {
      throw new NotFoundError(`Tenant '${id}' not found`);
    }
    await this.logTenantAction(id, user, 'TENANT_RESTORE', { status: TenantStatus.ACTIVE });
    return updated;
  }

  /**
   * Soft delete tenant
   */
  public async softDeleteTenant(id: string, user: IUserIdentity): Promise<ITenantDocument> {
    const updated = await tenantRepository.setStatus(id, TenantStatus.DELETED);
    if (!updated) {
      throw new NotFoundError(`Tenant '${id}' not found`);
    }
    await this.logTenantAction(id, user, 'TENANT_DELETE', { status: TenantStatus.DELETED });
    return updated;
  }

  /**
   * List and search tenants with pagination
   */
  public async listTenants(
    filters: ITenantFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<IPaginatedTenants> {
    return await tenantRepository.findAll(filters, page, limit);
  }

  /**
   * Get administrative audit logs
   */
  public async getTenantAuditLogs(
    id: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ docs: ITenantAuditLogDocument[]; total: number; totalPages: number }> {
    return await tenantRepository.findAuditLogs(id, page, limit);
  }

  /**
   * Helper to boot-strap a default tenant weventurehub if missing
   */
  public async seedDefaultTenant(): Promise<void> {
    try {
      const existing = await tenantRepository.findById('weventurehub');
      if (!existing) {
        logger.info('🌱 Bootstrap: Creating default enterprise tenant: "weventurehub"...');
        const expiry = new Date();
        expiry.setFullYear(expiry.getFullYear() + 5); // 5 year enterprise plan

        await tenantRepository.create({
          id: 'weventurehub',
          name: 'WeVentureHub',
          description: 'Default Master SaaS Hub Tenant Space',
          status: TenantStatus.ACTIVE,
          settings: {
            language: 'en',
            timezone: 'America/New_York',
            currency: 'USD',
          },
          branding: {
            primaryColor: '#0284c7',
            secondaryColor: '#0f172a',
            themeMode: 'light',
            emailBranding: {
              headerColor: '#0284c7',
              footerText: '© WeVentureHub Enterprise. All rights reserved.',
              supportEmail: 'support@weventurehub.com',
            },
            loginBranding: {
              title: 'WeVentureHub',
              subtitle: 'Multi-Tenant Workspace & Event Hub',
            },
          },
          subscription: {
            plan: SubscriptionPlan.ENTERPRISE,
            isTrial: false,
            expiresAt: expiry,
            limits: {
              maxWorkspaces: 100,
              maxEvents: 500,
              maxUsers: 1000,
            },
            featureFlags: {
              enableAdvancedAnalytics: true,
              enableAPIIntegrations: true,
              enableCustomDomain: true,
            },
          },
        });
        logger.info('🌱 Bootstrap: Default tenant "weventurehub" created successfully.');
      }
    } catch (err) {
      logger.error('🌱 Bootstrap: Error seeding default tenant weventurehub', err);
    }
  }
}

export const tenantService = new TenantService();

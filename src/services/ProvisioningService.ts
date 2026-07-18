import { Tenant } from '../models/Tenant';
import { TenantAuditLog } from '../models/TenantAuditLog';
import { Workspace } from '../models/Workspace';
import { invitationService } from './InvitationService';
import { SubscriptionPlan, TenantStatus, UserRole, IUserIdentity } from '../types';
import { ValidationError } from '../errors/AppError';
import { logger } from '../utils/logger';

export interface IOnboardingPayload {
  organizationId: string; // unique slug
  organizationName: string;
  description?: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  settings?: {
    language: string;
    timezone: string;
    currency: string;
  };
  branding?: {
    primaryColor: string;
    secondaryColor: string;
    themeMode: 'light' | 'dark' | 'auto';
    logoUrl?: string;
  };
  selectedPlan: SubscriptionPlan;
  teamInvitations?: Array<{ email: string; role: UserRole }>;
}

export class ProvisioningService {
  /**
   * Provisions a brand new self-service organization/tenant from onboarding payload
   */
  public async provisionOrganization(data: IOnboardingPayload): Promise<any> {
    const {
      organizationId,
      organizationName,
      description,
      adminEmail,
      selectedPlan,
      settings,
      branding,
      teamInvitations,
    } = data;

    if (!organizationId || !organizationName || !adminEmail) {
      throw new ValidationError('Organization ID, Organization Name, and Admin Email are required');
    }

    const tenantSlug = organizationId.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
    if (!tenantSlug) {
      throw new ValidationError('Organization ID must be alphanumeric or contain hyphens');
    }

    // Ensure it doesn't collide with existing tenants
    const existing = await Tenant.findById(tenantSlug);
    if (existing) {
      throw new ValidationError(`Organization domain name or URL slug '${tenantSlug}' is already taken`);
    }

    // Set trial expiration (14 days)
    const trialExpiry = new Date();
    trialExpiry.setDate(trialExpiry.getDate() + 14);

    // Determine plan limits
    let maxWorkspaces = 5;
    let maxEvents = 10;
    let maxUsers = 10;

    if (selectedPlan === SubscriptionPlan.GROWTH) {
      maxWorkspaces = 15;
      maxEvents = 30;
      maxUsers = 25;
    } else if (selectedPlan === SubscriptionPlan.ENTERPRISE) {
      maxWorkspaces = 100;
      maxEvents = 500;
      maxUsers = 1000;
    }

    // Configure default settings and branding
    const defaultSettings = {
      language: settings?.language || 'en',
      timezone: settings?.timezone || 'UTC',
      currency: settings?.currency || 'USD',
    };

    const defaultBranding = {
      primaryColor: branding?.primaryColor || '#0284c7',
      secondaryColor: branding?.secondaryColor || '#0f172a',
      themeMode: branding?.themeMode || 'light',
      logoUrl: branding?.logoUrl || '',
      emailBranding: {
        headerColor: branding?.primaryColor || '#0284c7',
        footerText: `© ${organizationName}. Powered by WeVentureHub.`,
        supportEmail: adminEmail,
      },
      loginBranding: {
        title: organizationName,
        subtitle: 'Enterprise Event & Workspace Portal',
      },
    };

    // Create Tenant
    const tenant = await Tenant.create({
      _id: tenantSlug,
      id: tenantSlug,
      name: organizationName,
      description: description || 'No description provided.',
      status: TenantStatus.ACTIVE,
      settings: defaultSettings,
      branding: defaultBranding,
      subscription: {
        plan: selectedPlan,
        isTrial: true,
        expiresAt: trialExpiry,
        limits: {
          maxWorkspaces,
          maxEvents,
          maxUsers,
        },
        featureFlags: {
          enableAdvancedAnalytics: selectedPlan !== SubscriptionPlan.FREE,
          enableAPIIntegrations: selectedPlan === SubscriptionPlan.ENTERPRISE,
          enableCustomDomain: selectedPlan === SubscriptionPlan.ENTERPRISE,
        },
      },
    });

    // Seed some initial demo workspaces to make the workspace functional immediately
    try {
      await Workspace.create([
        {
          tenantId: tenantSlug,
          name: 'Conference Room Alpha',
          type: 'MEETING_ROOM',
          capacity: 10,
          hourlyRate: 30.0,
          currency: defaultSettings.currency,
          amenities: ['TV Screen', 'Whiteboard', 'Webcam'],
          isAvailable: true,
          availabilityRules: { startHour: 8, endHour: 20, allowedDays: [0, 1, 2, 3, 4, 5, 6] },
          bufferTime: 15,
        },
        {
          tenantId: tenantSlug,
          name: 'Hot Desk Station 1',
          type: 'HOT_DESK',
          capacity: 1,
          hourlyRate: 5.0,
          currency: defaultSettings.currency,
          amenities: ['Ethernet', 'Ergonomic Chair'],
          isAvailable: true,
          availabilityRules: { startHour: 0, endHour: 24, allowedDays: [0, 1, 2, 3, 4, 5, 6] },
          bufferTime: 0,
        },
      ]);
    } catch (wsErr) {
      logger.error('Failed to provision initial workspaces', wsErr);
    }

    // Mock active user for initial audit logging
    const mockAdminUser: IUserIdentity = {
      id: 'usr_owner',
      tenantId: tenantSlug,
      email: adminEmail,
      firstName: data.adminFirstName,
      lastName: data.adminLastName,
      role: UserRole.TENANT_ADMIN,
      permissions: [],
    };

    // Log creation
    try {
      await TenantAuditLog.create({
        tenantId: tenantSlug,
        userId: mockAdminUser.id,
        userEmail: adminEmail,
        action: 'TENANT_PROVISIONED',
        details: {
          organizationName,
          selectedPlan,
          adminName: `${data.adminFirstName} ${data.adminLastName}`,
        },
      });
    } catch (auditErr) {
      logger.error('Failed to log tenant provisioning action', auditErr);
    }

    // Process team invitations if specified
    const sentInvitations: any[] = [];
    if (teamInvitations && Array.isArray(teamInvitations)) {
      for (const invite of teamInvitations) {
        try {
          const invRecord = await invitationService.createInvitation(
            tenantSlug,
            invite.email,
            invite.role || UserRole.HUB_MEMBER,
            mockAdminUser
          );
          sentInvitations.push({
            id: invRecord.id,
            email: invRecord.email,
            role: invRecord.role,
            token: invRecord.token,
          });
        } catch (invErr) {
          logger.error(`Failed to dispatch onboarding team invitation to ${invite.email}`, invErr);
        }
      }
    }

    return {
      success: true,
      tenantId: tenantSlug,
      tenant,
      adminUser: mockAdminUser,
      sentInvitations,
    };
  }
}

export const provisioningService = new ProvisioningService();

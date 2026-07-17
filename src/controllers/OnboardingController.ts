import { Request, Response, NextFunction } from 'express';
import { provisioningService } from '../services/ProvisioningService';
import { invitationService } from '../services/InvitationService';
import { ApiResponse } from '../utils/response';
import { SubscriptionPlan, UserRole } from '../types';
import { ValidationError, NotFoundError } from '../errors/AppError';

export class OnboardingController {
  /**
   * Run the automatic provisioning & organization onboarding wizard pipeline
   */
  public async provision(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        organizationId,
        organizationName,
        description,
        adminFirstName,
        adminLastName,
        adminEmail,
        selectedPlan,
        settings,
        branding,
        teamInvitations,
      } = req.body;

      if (!organizationId || !organizationName || !adminEmail || !adminFirstName || !adminLastName) {
        throw new ValidationError('Missing required onboarding inputs: organizationId, organizationName, adminFirstName, adminLastName, adminEmail');
      }

      const planVal = selectedPlan || SubscriptionPlan.FREE;

      const result = await provisioningService.provisionOrganization({
        organizationId,
        organizationName,
        description,
        adminFirstName,
        adminLastName,
        adminEmail,
        selectedPlan: planVal as SubscriptionPlan,
        settings,
        branding,
        teamInvitations,
      });

      ApiResponse.success(res, result, 201, {
        message: 'Organization provisioned and initial workspace seeded successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch standard subscription plans for wizard comparison
   */
  public async listPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = [
        {
          id: SubscriptionPlan.FREE,
          name: 'Free Trial',
          price: 0,
          billingPeriod: '14-day trial',
          features: ['Up to 5 Workspaces', 'Up to 10 Live Events', 'Up to 10 Team Members', 'Standard Analytics'],
          limits: { maxWorkspaces: 5, maxEvents: 10, maxUsers: 10 },
        },
        {
          id: SubscriptionPlan.GROWTH,
          name: 'Growth Plan',
          price: 49,
          billingPeriod: 'month',
          features: ['Up to 15 Workspaces', 'Up to 30 Live Events', 'Up to 25 Team Members', 'Advanced Analytics Dashboard', 'Dedicated Email Branding'],
          limits: { maxWorkspaces: 15, maxEvents: 30, maxUsers: 25 },
        },
        {
          id: SubscriptionPlan.ENTERPRISE,
          name: 'Pro Enterprise',
          price: 149,
          billingPeriod: 'month',
          features: ['Unlimited Workspaces', 'Unlimited Live Events', 'Up to 1000 Team Members', 'Custom Login Branding', 'Priority API Integrations', 'Dedicated Custom Domain Options'],
          limits: { maxWorkspaces: 100, maxEvents: 500, maxUsers: 1000 },
        },
      ];

      ApiResponse.success(res, plans, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Dispatch an invitation (requires authentication within the tenant context)
   */
  public async inviteMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, role } = req.body;
      const tenantId = req.user?.tenantId || req.tenantId;

      if (!tenantId) {
        throw new ValidationError('Tenant organization scope could not be resolved from headers or session');
      }

      if (!email) {
        throw new ValidationError('Invitation target email is required');
      }

      const invitation = await invitationService.createInvitation(
        tenantId,
        email,
        (role as UserRole) || UserRole.HUB_MEMBER,
        req.user!
      );

      ApiResponse.success(res, invitation, 201, {
        message: `Invitation successfully dispatched to ${email}`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all invitations in active organization context
   */
  public async listInvitations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || req.tenantId;
      if (!tenantId) {
        throw new ValidationError('Tenant context unresolved');
      }

      const invitations = await invitationService.listTenantInvitations(tenantId);
      ApiResponse.success(res, invitations, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke invitation
   */
  public async revokeInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tenantId = req.user?.tenantId || req.tenantId;
      if (!tenantId) {
        throw new ValidationError('Tenant context unresolved');
      }

      await invitationService.revokeInvitation(id, tenantId, req.user!);
      ApiResponse.success(res, { success: true }, 200, {
        message: 'Invitation revoked successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate / Get invitation details by token
   */
  public async getInvitationDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      if (!token) {
        throw new ValidationError('Invitation token parameter is required');
      }

      const invitation = await invitationService.getInvitationByToken(token);
      ApiResponse.success(res, invitation, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Complete invitation acceptance flow
   */
  public async acceptInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;
      if (!token) {
        throw new ValidationError('Invitation token is required');
      }

      const accepted = await invitationService.acceptInvitation(token);
      ApiResponse.success(res, accepted, 200, {
        message: 'Invitation accepted successfully. Welcome to the workspace!',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const onboardingController = new OnboardingController();

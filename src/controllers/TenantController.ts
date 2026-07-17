import { Request, Response, NextFunction } from 'express';
import { tenantService } from '../services/TenantService';
import { ApiResponse } from '../utils/response';
import { UserRole, TenantStatus, SubscriptionPlan } from '../types';
import { UnauthorizedError, ForbiddenError, ValidationError } from '../errors/AppError';

export class TenantController {
  /**
   * Helper to verify if the requester has Super Admin privileges
   */
  private checkSuperAdmin(req: Request): void {
    if (!req.user) {
      throw new UnauthorizedError('Authentication session required');
    }
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenError('Only System Super Admins are authorized to perform this operation');
    }
  }

  /**
   * Helper to verify if requester is authorized for a specific Tenant ID
   */
  private checkTenantAccess(req: Request, tenantId: string): void {
    if (!req.user) {
      throw new UnauthorizedError('Authentication session required');
    }
    if (req.user.role === UserRole.SUPER_ADMIN) {
      return; // Super admins can bypass tenant boundaries
    }
    if (req.user.tenantId !== tenantId) {
      throw new ForbiddenError('Unauthorized: You cannot access or modify resources of another organization');
    }
    if (req.user.role !== UserRole.TENANT_ADMIN) {
      throw new ForbiddenError('Unauthorized: Administrative level permissions are required');
    }
  }

  /**
   * Create an Organization/Tenant (Super Admin Only)
   */
  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.checkSuperAdmin(req);
      const tenant = await tenantService.createTenant(req.body, req.user!);
      ApiResponse.success(res, tenant, 201, {
        message: 'Organization created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single organization details (Super Admin or Tenant Admin/Staff of that tenant)
   */
  public async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!req.user) {
        throw new UnauthorizedError('Authentication session required');
      }
      // Access allowed to Super Admin, or any member belonging to this tenant
      if (req.user.role !== UserRole.SUPER_ADMIN && req.user.tenantId !== id) {
        throw new ForbiddenError('Unauthorized tenant resource access attempt');
      }

      const tenant = await tenantService.getTenantById(id);
      ApiResponse.success(res, tenant, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update Organization profile name/description
   */
  public async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      this.checkTenantAccess(req, id);
      const tenant = await tenantService.updateTenant(id, req.body, req.user!);
      ApiResponse.success(res, tenant, 200, {
        message: 'Organization details updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update localization settings (timezone, currency, language)
   */
  public async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      this.checkTenantAccess(req, id);
      const tenant = await tenantService.updateTenantSettings(id, req.body, req.user!);
      ApiResponse.success(res, tenant, 200, {
        message: 'Localization settings saved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update organization branding elements (logo, colors, login styles)
   */
  public async updateBranding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      this.checkTenantAccess(req, id);
      const tenant = await tenantService.updateTenantBranding(id, req.body, req.user!);
      ApiResponse.success(res, tenant, 200, {
        message: 'Branding options updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update organization subscription (Super Admin Only)
   */
  public async updateSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.checkSuperAdmin(req);
      const { id } = req.params;
      const tenant = await tenantService.updateTenantSubscription(id, req.body, req.user!);
      ApiResponse.success(res, tenant, 200, {
        message: 'Tenant subscription plan changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Suspend an organization (Super Admin Only)
   */
  public async suspend(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.checkSuperAdmin(req);
      const { id } = req.params;
      const tenant = await tenantService.suspendTenant(id, req.user!);
      ApiResponse.success(res, tenant, 200, {
        message: 'Organization suspended successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Restore suspended organization to ACTIVE (Super Admin Only)
   */
  public async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.checkSuperAdmin(req);
      const { id } = req.params;
      const tenant = await tenantService.restoreTenant(id, req.user!);
      ApiResponse.success(res, tenant, 200, {
        message: 'Organization restored successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Soft-delete organization (Super Admin Only)
   */
  public async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.checkSuperAdmin(req);
      const { id } = req.params;
      const tenant = await tenantService.softDeleteTenant(id, req.user!);
      ApiResponse.success(res, tenant, 200, {
        message: 'Organization soft-deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List organizations with pagination (Super Admin Only)
   */
  public async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.checkSuperAdmin(req);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const filters = {
        search: req.query.search as string,
        status: req.query.status as TenantStatus,
        plan: req.query.plan as SubscriptionPlan,
      };

      const result = await tenantService.listTenants(filters, page, limit);
      ApiResponse.paginated(res, result.docs, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasNextPage: result.page < result.totalPages,
        hasPrevPage: result.page > 1,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch tenant action audit logs (Super Admin or Tenant Admin of that tenant)
   */
  public async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      this.checkTenantAccess(req, id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await tenantService.getTenantAuditLogs(id, page, limit);
      ApiResponse.success(res, result.docs, 200, {
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update organization public website settings
   */
  public async updateWebsite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      this.checkTenantAccess(req, id);
      const tenant = await tenantService.updateTenantWebsite(id, req.body, req.user!);
      ApiResponse.success(res, tenant, 200, {
        message: 'Public website settings saved successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const tenantController = new TenantController();

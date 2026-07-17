import { Request, Response, NextFunction } from 'express';
import { workspaceService } from '../services/WorkspaceService';
import { ApiResponse } from '../utils/response';
import { IUserIdentity } from '../types';

export class WorkspaceController {
  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const user = req.user as IUserIdentity;
      const workspace = await workspaceService.createWorkspace(tenantId, req.body, user);
      ApiResponse.success(res, workspace, 201, {
        message: 'Workspace resource established successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  public async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const workspace = await workspaceService.getWorkspaceById(id, tenantId);
      ApiResponse.success(res, workspace, 200);
    } catch (error) {
      next(error);
    }
  }

  public async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const user = req.user as IUserIdentity;
      const workspace = await workspaceService.updateWorkspace(id, tenantId, req.body, user);
      ApiResponse.success(res, workspace, 200, {
        message: 'Workspace resource updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  public async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const user = req.user as IUserIdentity;
      await workspaceService.deleteWorkspace(id, tenantId, user);
      ApiResponse.success(res, { id }, 200, {
        message: 'Workspace resource soft-deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  public async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;

      const filters = {
        search: req.query.search as string,
        type: req.query.type as any,
        isAvailable: req.query.isAvailable !== undefined ? req.query.isAvailable === 'true' : undefined,
        minCapacity: req.query.minCapacity ? parseInt(req.query.minCapacity as string) : undefined,
      };

      const result = await workspaceService.listWorkspaces(tenantId, filters, page, limit);
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
}

export const workspaceController = new WorkspaceController();

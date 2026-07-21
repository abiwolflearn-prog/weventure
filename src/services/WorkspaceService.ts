import { workspaceRepository, IWorkspaceFilters, IPaginatedWorkspaces } from '../repositories/WorkspaceRepository';
import { AuditLog } from '../models/AuditLog';
import { IWorkspaceDocument } from '../models/Workspace';
import { IUserIdentity } from '../types';
import { ValidationError, NotFoundError } from '../errors/AppError';
import { subscriptionService } from './SubscriptionService';

export class WorkspaceService {
  private async logActivity(
    tenantId: string,
    user: IUserIdentity,
    action: string,
    resourceId: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      await AuditLog.create({
        tenantId,
        userId: user.id,
        userEmail: user.email,
        action,
        resourceType: 'WORKSPACE',
        resourceId,
        details,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Audit logging failed for workspace:', err);
    }
  }

  public async createWorkspace(
    tenantId: string,
    data: any,
    user: IUserIdentity
  ): Promise<IWorkspaceDocument> {
    if (!data.name || !data.type || data.capacity === undefined || data.hourlyRate === undefined) {
      throw new ValidationError('Required workspace fields: name, type, capacity, hourlyRate');
    }

    // Subscription Limit Check
    const currentUsage = await subscriptionService.syncUsageCounts(tenantId);
    const limitCheck = await subscriptionService.checkLimitExceeded(tenantId, 'maxWorkspaces', currentUsage.workspacesCount + 1);
    if (limitCheck.exceeded) {
      throw new ValidationError(`Workspace creation blocked: Your current subscription plan only permits up to ${limitCheck.limit} workspaces. Please upgrade your subscription to create more.`);
    }

    const payload = {
      tenantId,
      name: data.name,
      type: data.type,
      capacity: Number(data.capacity),
      hourlyRate: Number(data.hourlyRate),
      currency: data.currency || 'USD',
      amenities: data.amenities || [],
      isAvailable: data.isAvailable !== undefined ? !!data.isAvailable : true,
      availabilityRules: data.availabilityRules || {
        startHour: 0,
        endHour: 24,
        allowedDays: [0, 1, 2, 3, 4, 5, 6],
      },
      bufferTime: data.bufferTime !== undefined ? Number(data.bufferTime) : 0,
      imageUrl: data.imageUrl,
      billingPlans: data.billingPlans || [],
    };

    const workspace = await workspaceRepository.create(payload);
    await subscriptionService.incrementUsage(tenantId, 'workspacesCount', 1);
    await this.logActivity(tenantId, user, 'CREATE_WORKSPACE', workspace.id, { name: workspace.name });
    return workspace;
  }

  public async getWorkspaceById(id: string, tenantId: string): Promise<IWorkspaceDocument> {
    const workspace = await workspaceRepository.findById(id, tenantId);
    if (!workspace) {
      throw new NotFoundError('Workspace not found or unauthorized');
    }
    return workspace;
  }

  public async updateWorkspace(
    id: string,
    tenantId: string,
    updateData: any,
    user: IUserIdentity
  ): Promise<IWorkspaceDocument> {
    const workspace = await this.getWorkspaceById(id, tenantId);

    const payload: Partial<any> = {};
    if (updateData.name !== undefined) payload.name = updateData.name;
    if (updateData.type !== undefined) payload.type = updateData.type;
    if (updateData.capacity !== undefined) payload.capacity = Number(updateData.capacity);
    if (updateData.hourlyRate !== undefined) payload.hourlyRate = Number(updateData.hourlyRate);
    if (updateData.currency !== undefined) payload.currency = updateData.currency;
    if (updateData.amenities !== undefined) payload.amenities = updateData.amenities;
    if (updateData.isAvailable !== undefined) payload.isAvailable = !!updateData.isAvailable;
    if (updateData.availabilityRules !== undefined) payload.availabilityRules = updateData.availabilityRules;
    if (updateData.bufferTime !== undefined) payload.bufferTime = Number(updateData.bufferTime);
    if (updateData.imageUrl !== undefined) payload.imageUrl = updateData.imageUrl;
    if (updateData.billingPlans !== undefined) payload.billingPlans = updateData.billingPlans;

    const updated = await workspaceRepository.update(id, tenantId, payload);
    if (!updated) {
      throw new NotFoundError('Workspace update failed');
    }

    await this.logActivity(tenantId, user, 'UPDATE_WORKSPACE', updated.id, { changedFields: Object.keys(payload) });
    return updated;
  }

  public async deleteWorkspace(id: string, tenantId: string, user: IUserIdentity): Promise<boolean> {
    const workspace = await this.getWorkspaceById(id, tenantId);
    const success = await workspaceRepository.softDelete(id, tenantId);
    if (success) {
      await subscriptionService.incrementUsage(tenantId, 'workspacesCount', -1);
      await this.logActivity(tenantId, user, 'DELETE_WORKSPACE', id, { name: workspace.name });
    }
    return success;
  }

  public async listWorkspaces(
    tenantId: string,
    filters: IWorkspaceFilters,
    page: number = 1,
    limit: number = 100
  ): Promise<IPaginatedWorkspaces> {
    return await workspaceRepository.findAll(tenantId, filters, page, limit);
  }
}

export const workspaceService = new WorkspaceService();

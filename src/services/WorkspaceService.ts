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
    const titleName = data.title || data.name;
    const priceRate = data.hourlyPrice !== undefined ? Number(data.hourlyPrice) : (data.hourlyRate !== undefined ? Number(data.hourlyRate) : 0);
    const wType = data.workspaceType || data.type || 'MEETING_ROOM';

    if (!titleName || !wType || data.capacity === undefined) {
      throw new ValidationError('Required workspace fields: title/name, category/type, capacity, hourlyPrice');
    }

    // Subscription Limit Check
    const currentUsage = await subscriptionService.syncUsageCounts(tenantId);
    const limitCheck = await subscriptionService.checkLimitExceeded(tenantId, 'maxWorkspaces', currentUsage.workspacesCount + 1);
    if (limitCheck.exceeded) {
      throw new ValidationError(`Workspace creation blocked: Your current subscription plan permits up to ${limitCheck.limit} workspaces. Please upgrade your subscription to create more.`);
    }

    const payload = {
      tenantId,
      title: titleName,
      name: titleName,
      slug: data.slug || titleName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      shortDescription: data.shortDescription || '',
      fullDescription: data.fullDescription || '',
      category: data.category || 'Meeting Room',
      workspaceType: wType,
      type: wType,
      capacity: Number(data.capacity),
      floor: data.floor || 'Floor 1',
      size: data.size || '350 sq ft',
      hourlyPrice: priceRate,
      hourlyRate: priceRate,
      dailyPrice: data.dailyPrice !== undefined ? Number(data.dailyPrice) : (data.dailyRate !== undefined ? Number(data.dailyRate) : 0),
      dailyRate: data.dailyRate !== undefined ? Number(data.dailyRate) : (data.dailyPrice !== undefined ? Number(data.dailyPrice) : 0),
      weeklyPrice: data.weeklyPrice !== undefined ? Number(data.weeklyPrice) : 0,
      monthlyPrice: data.monthlyPrice !== undefined ? Number(data.monthlyPrice) : 0,
      currency: data.currency || 'USD',
      coverImage: data.coverImage || data.imageUrl || '',
      imageUrl: data.imageUrl || data.coverImage || '',
      galleryImages: Array.isArray(data.galleryImages) ? data.galleryImages : [],
      amenities: Array.isArray(data.amenities) ? data.amenities : [],
      features: Array.isArray(data.features) ? data.features : [],
      availability: data.availability || (data.isAvailable !== false ? 'Available' : 'Occupied'),
      isAvailable: data.isAvailable !== undefined ? !!data.isAvailable : true,
      openingHours: data.openingHours || '08:00',
      closingHours: data.closingHours || '20:00',
      location: data.location || 'WeVentureHub Main Campus',
      mapLocation: data.mapLocation || '',
      status: data.status || 'published',
      featured: !!data.featured,
      displayOrder: data.displayOrder !== undefined ? Number(data.displayOrder) : 0,
      rating: data.rating !== undefined ? Number(data.rating) : 5.0,
      totalReviews: data.totalReviews !== undefined ? Number(data.totalReviews) : 0,
      createdBy: user?.id || user?.email,
      updatedBy: user?.id || user?.email,
      availabilityRules: data.availabilityRules || {
        startHour: 0,
        endHour: 24,
        allowedDays: [0, 1, 2, 3, 4, 5, 6],
      },
      bufferTime: data.bufferTime !== undefined ? Number(data.bufferTime) : 0,
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
    await this.getWorkspaceById(id, tenantId);

    const payload: Partial<any> = {
      updatedBy: user?.id || user?.email,
    };

    if (updateData.title !== undefined) {
      payload.title = updateData.title;
      payload.name = updateData.title;
    } else if (updateData.name !== undefined) {
      payload.title = updateData.name;
      payload.name = updateData.name;
    }

    if (updateData.slug !== undefined) payload.slug = updateData.slug;
    if (updateData.shortDescription !== undefined) payload.shortDescription = updateData.shortDescription;
    if (updateData.fullDescription !== undefined) payload.fullDescription = updateData.fullDescription;
    if (updateData.category !== undefined) payload.category = updateData.category;
    
    if (updateData.workspaceType !== undefined) {
      payload.workspaceType = updateData.workspaceType;
      payload.type = updateData.workspaceType;
    } else if (updateData.type !== undefined) {
      payload.workspaceType = updateData.type;
      payload.type = updateData.type;
    }

    if (updateData.capacity !== undefined) payload.capacity = Number(updateData.capacity);
    if (updateData.floor !== undefined) payload.floor = updateData.floor;
    if (updateData.size !== undefined) payload.size = updateData.size;

    if (updateData.hourlyPrice !== undefined) {
      payload.hourlyPrice = Number(updateData.hourlyPrice);
      payload.hourlyRate = Number(updateData.hourlyPrice);
    } else if (updateData.hourlyRate !== undefined) {
      payload.hourlyPrice = Number(updateData.hourlyRate);
      payload.hourlyRate = Number(updateData.hourlyRate);
    }

    if (updateData.dailyPrice !== undefined) {
      payload.dailyPrice = Number(updateData.dailyPrice);
      payload.dailyRate = Number(updateData.dailyPrice);
    } else if (updateData.dailyRate !== undefined) {
      payload.dailyPrice = Number(updateData.dailyRate);
      payload.dailyRate = Number(updateData.dailyRate);
    }

    if (updateData.weeklyPrice !== undefined) payload.weeklyPrice = Number(updateData.weeklyPrice);
    if (updateData.monthlyPrice !== undefined) payload.monthlyPrice = Number(updateData.monthlyPrice);
    if (updateData.currency !== undefined) payload.currency = updateData.currency;

    if (updateData.coverImage !== undefined) {
      payload.coverImage = updateData.coverImage;
      payload.imageUrl = updateData.coverImage;
    } else if (updateData.imageUrl !== undefined) {
      payload.coverImage = updateData.imageUrl;
      payload.imageUrl = updateData.imageUrl;
    }

    if (updateData.galleryImages !== undefined) payload.galleryImages = updateData.galleryImages;
    if (updateData.amenities !== undefined) payload.amenities = updateData.amenities;
    if (updateData.features !== undefined) payload.features = updateData.features;

    if (updateData.availability !== undefined) {
      payload.availability = updateData.availability;
      payload.isAvailable = updateData.availability === 'Available';
    } else if (updateData.isAvailable !== undefined) {
      payload.isAvailable = !!updateData.isAvailable;
      payload.availability = updateData.isAvailable ? 'Available' : 'Occupied';
    }

    if (updateData.openingHours !== undefined) payload.openingHours = updateData.openingHours;
    if (updateData.closingHours !== undefined) payload.closingHours = updateData.closingHours;
    if (updateData.location !== undefined) payload.location = updateData.location;
    if (updateData.mapLocation !== undefined) payload.mapLocation = updateData.mapLocation;
    if (updateData.status !== undefined) payload.status = updateData.status;
    if (updateData.featured !== undefined) payload.featured = !!updateData.featured;
    if (updateData.displayOrder !== undefined) payload.displayOrder = Number(updateData.displayOrder);

    if (updateData.availabilityRules !== undefined) payload.availabilityRules = updateData.availabilityRules;
    if (updateData.bufferTime !== undefined) payload.bufferTime = Number(updateData.bufferTime);
    if (updateData.billingPlans !== undefined) payload.billingPlans = updateData.billingPlans;

    const updated = await workspaceRepository.update(id, tenantId, payload);
    if (!updated) {
      throw new NotFoundError('Workspace update failed');
    }

    await this.logActivity(tenantId, user, 'UPDATE_WORKSPACE', updated.id, { changedFields: Object.keys(payload) });
    return updated;
  }

  public async updateWorkspaceStatus(id: string, tenantId: string, status: 'published' | 'draft' | 'archived', user: IUserIdentity): Promise<IWorkspaceDocument> {
    const updated = await workspaceRepository.updateStatus(id, tenantId, status);
    if (!updated) {
      throw new NotFoundError('Workspace not found or unauthorized');
    }
    await this.logActivity(tenantId, user, 'UPDATE_WORKSPACE_STATUS', id, { status });
    return updated;
  }

  public async toggleWorkspaceFeatured(id: string, tenantId: string, featured: boolean, user: IUserIdentity): Promise<IWorkspaceDocument> {
    const updated = await workspaceRepository.updateFeatured(id, tenantId, featured);
    if (!updated) {
      throw new NotFoundError('Workspace not found or unauthorized');
    }
    await this.logActivity(tenantId, user, 'TOGGLE_WORKSPACE_FEATURED', id, { featured });
    return updated;
  }

  public async updateWorkspaceOrder(id: string, tenantId: string, displayOrder: number, user: IUserIdentity): Promise<IWorkspaceDocument> {
    const updated = await workspaceRepository.updateDisplayOrder(id, tenantId, displayOrder);
    if (!updated) {
      throw new NotFoundError('Workspace not found or unauthorized');
    }
    await this.logActivity(tenantId, user, 'UPDATE_WORKSPACE_ORDER', id, { displayOrder });
    return updated;
  }

  public async duplicateWorkspace(id: string, tenantId: string, user: IUserIdentity): Promise<IWorkspaceDocument> {
    const duplicated = await workspaceRepository.duplicate(id, tenantId, user?.id || user?.email);
    if (!duplicated) {
      throw new NotFoundError('Workspace not found or unauthorized');
    }
    await subscriptionService.incrementUsage(tenantId, 'workspacesCount', 1);
    await this.logActivity(tenantId, user, 'DUPLICATE_WORKSPACE', duplicated.id, { originalId: id });
    return duplicated;
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

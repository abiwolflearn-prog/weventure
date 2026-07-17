import { Tenant, ITenantDocument } from '../models/Tenant';
import { TenantAuditLog, ITenantAuditLogDocument } from '../models/TenantAuditLog';
import { TenantStatus, SubscriptionPlan } from '../types';

export interface ITenantFilters {
  search?: string;
  status?: TenantStatus;
  plan?: SubscriptionPlan;
}

export interface IPaginatedTenants {
  docs: ITenantDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class TenantRepository {
  /**
   * Create new tenant organization
   */
  public async create(data: Partial<any>): Promise<ITenantDocument> {
    const tenant = new Tenant({
      _id: data.id, // we map the id to _id
      ...data,
    });
    return await tenant.save();
  }

  /**
   * Find tenant by id / slug
   */
  public async findById(id: string): Promise<ITenantDocument | null> {
    return await Tenant.findById(id).exec();
  }

  /**
   * Update tenant
   */
  public async update(id: string, updateData: Partial<any>): Promise<ITenantDocument | null> {
    return await Tenant.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * Soft Delete or Hard Delete/Suspend is handled by changing the status.
   * If a soft delete is specifically requested, we set status to DELETED.
   */
  public async setStatus(id: string, status: TenantStatus): Promise<ITenantDocument | null> {
    return await Tenant.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    ).exec();
  }

  /**
   * Find all tenants with pagination & search
   */
  public async findAll(
    filters: ITenantFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<IPaginatedTenants> {
    const query: any = {};

    // By default, exclude DELETED tenants unless explicitly requested
    if (filters.status) {
      query.status = filters.status;
    } else {
      query.status = { $ne: TenantStatus.DELETED };
    }

    if (filters.search) {
      query.$or = [
        { _id: { $regex: filters.search, $options: 'i' } },
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (filters.plan) {
      query['subscription.plan'] = filters.plan;
    }

    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      Tenant.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      Tenant.countDocuments(query).exec(),
    ]);

    return {
      docs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Log an administrative audit action
   */
  public async createAuditLog(data: {
    tenantId: string;
    userId: string;
    userEmail: string;
    action: string;
    ipAddress?: string;
    details?: Record<string, any>;
  }): Promise<ITenantAuditLogDocument> {
    const log = new TenantAuditLog({
      ...data,
      timestamp: new Date(),
    });
    return await log.save();
  }

  /**
   * Find audit logs with pagination
   */
  public async findAuditLogs(
    tenantId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ docs: ITenantAuditLogDocument[]; total: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      TenantAuditLog.find({ tenantId }).sort({ timestamp: -1 }).skip(skip).limit(limit).exec(),
      TenantAuditLog.countDocuments({ tenantId }).exec(),
    ]);

    return {
      docs,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}

export const tenantRepository = new TenantRepository();

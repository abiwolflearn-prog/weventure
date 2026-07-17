import { Workspace, IWorkspaceDocument } from '../models/Workspace';

export interface IWorkspaceFilters {
  search?: string;
  type?: 'HOT_DESK' | 'MEETING_ROOM' | 'EVENT_VENUE';
  isAvailable?: boolean;
  minCapacity?: number;
}

export interface IPaginatedWorkspaces {
  docs: IWorkspaceDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class WorkspaceRepository {
  public async create(data: Partial<any>): Promise<IWorkspaceDocument> {
    const workspace = new Workspace(data);
    return await workspace.save();
  }

  public async findById(id: string, tenantId: string): Promise<IWorkspaceDocument | null> {
    return await Workspace.findOne({ _id: id, tenantId, isDeleted: false }).exec();
  }

  public async update(
    id: string,
    tenantId: string,
    updateData: Partial<any>
  ): Promise<IWorkspaceDocument | null> {
    return await Workspace.findOneAndUpdate(
      { _id: id, tenantId, isDeleted: false },
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();
  }

  public async softDelete(id: string, tenantId: string): Promise<boolean> {
    const result = await Workspace.findOneAndUpdate(
      { _id: id, tenantId, isDeleted: false },
      { $set: { isDeleted: true } }
    ).exec();
    return !!result;
  }

  public async findAll(
    tenantId: string,
    filters: IWorkspaceFilters,
    page: number = 1,
    limit: number = 100
  ): Promise<IPaginatedWorkspaces> {
    const query: any = { tenantId, isDeleted: false };

    if (filters.search) {
      query.name = { $regex: filters.search, $options: 'i' };
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.isAvailable !== undefined) {
      query.isAvailable = filters.isAvailable;
    }

    if (filters.minCapacity !== undefined) {
      query.capacity = { $gte: filters.minCapacity };
    }

    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      Workspace.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      Workspace.countDocuments(query).exec(),
    ]);

    return {
      docs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}

export const workspaceRepository = new WorkspaceRepository();

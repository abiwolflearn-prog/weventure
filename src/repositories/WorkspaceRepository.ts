import { Workspace, IWorkspaceDocument } from '../models/Workspace';

export interface IWorkspaceFilters {
  search?: string;
  category?: string;
  workspaceType?: string;
  type?: string;
  isAvailable?: boolean;
  availability?: string;
  minCapacity?: number;
  maxPrice?: number;
  status?: string;
  featured?: boolean;
  sort?: string;
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

  public async updateStatus(id: string, tenantId: string, status: 'published' | 'draft' | 'archived'): Promise<IWorkspaceDocument | null> {
    return await Workspace.findOneAndUpdate(
      { _id: id, tenantId, isDeleted: false },
      { $set: { status } },
      { new: true }
    ).exec();
  }

  public async updateFeatured(id: string, tenantId: string, featured: boolean): Promise<IWorkspaceDocument | null> {
    return await Workspace.findOneAndUpdate(
      { _id: id, tenantId, isDeleted: false },
      { $set: { featured } },
      { new: true }
    ).exec();
  }

  public async updateDisplayOrder(id: string, tenantId: string, displayOrder: number): Promise<IWorkspaceDocument | null> {
    return await Workspace.findOneAndUpdate(
      { _id: id, tenantId, isDeleted: false },
      { $set: { displayOrder } },
      { new: true }
    ).exec();
  }

  public async duplicate(id: string, tenantId: string, createdBy?: string): Promise<IWorkspaceDocument | null> {
    const original = await this.findById(id, tenantId);
    if (!original) return null;

    const originalObj = original.toObject();
    delete originalObj.id;
    delete originalObj._id;
    delete originalObj.createdAt;
    delete originalObj.updatedAt;

    const newTitle = `Copy of ${original.title || original.name}`;
    const duplicateData = {
      ...originalObj,
      title: newTitle,
      name: newTitle,
      slug: `${original.slug}-copy-${Date.now().toString(36)}`,
      status: 'draft',
      featured: false,
      displayOrder: (original.displayOrder || 0) + 1,
      createdBy: createdBy || original.createdBy,
    };

    return await this.create(duplicateData);
  }

  public async findAll(
    tenantId: string,
    filters: IWorkspaceFilters,
    page: number = 1,
    limit: number = 100
  ): Promise<IPaginatedWorkspaces> {
    const query: any = { tenantId, isDeleted: false };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.featured !== undefined) {
      query.featured = filters.featured;
    }

    if (filters.category) {
      query.category = { $regex: new RegExp(`^${filters.category}$`, 'i') };
    }

    const typeFilter = filters.workspaceType || filters.type;
    if (typeFilter) {
      query.$or = [
        { workspaceType: typeFilter },
        { type: typeFilter }
      ];
    }

    if (filters.isAvailable !== undefined) {
      query.isAvailable = filters.isAvailable;
    }

    if (filters.availability) {
      query.availability = filters.availability;
    }

    if (filters.minCapacity !== undefined && !isNaN(filters.minCapacity)) {
      query.capacity = { $gte: Number(filters.minCapacity) };
    }

    if (filters.maxPrice !== undefined && !isNaN(filters.maxPrice)) {
      query.$or = [
        { hourlyPrice: { $lte: Number(filters.maxPrice) } },
        { hourlyRate: { $lte: Number(filters.maxPrice) } }
      ];
    }

    if (filters.search) {
      const searchStr = String(filters.search).trim();
      const regex = { $regex: searchStr, $options: 'i' };
      query.$or = [
        { title: regex },
        { name: regex },
        { category: regex },
        { shortDescription: regex },
        { fullDescription: regex },
        { location: regex },
        { amenities: { $in: [new RegExp(searchStr, 'i')] } }
      ];
    }

    // Sort order map
    let sortObj: any = { displayOrder: 1, createdAt: -1 };
    if (filters.sort) {
      switch (filters.sort) {
        case 'price_asc':
          sortObj = { hourlyPrice: 1, hourlyRate: 1 };
          break;
        case 'price_desc':
          sortObj = { hourlyPrice: -1, hourlyRate: -1 };
          break;
        case 'capacity_desc':
          sortObj = { capacity: -1 };
          break;
        case 'name_asc':
          sortObj = { title: 1, name: 1 };
          break;
        case 'display_order':
          sortObj = { displayOrder: 1 };
          break;
        case 'newest':
          sortObj = { createdAt: -1 };
          break;
        default:
          sortObj = { displayOrder: 1, createdAt: -1 };
      }
    }

    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      Workspace.find(query).sort(sortObj).skip(skip).limit(limit).exec(),
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

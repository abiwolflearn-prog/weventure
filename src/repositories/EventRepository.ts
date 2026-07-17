import { Event, IEventDocument } from '../models/Event';
import { EventStatus, EventVisibility, IEvent } from '../types';

export interface IEventFilters {
  search?: string;
  category?: string;
  status?: EventStatus;
  visibility?: EventVisibility;
  tags?: string[];
  startDate?: string;
  endDate?: string;
}

export interface IPaginatedResult<T> {
  docs: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class EventRepository {
  /**
   * Create a new event
   */
  public async create(data: Partial<IEvent>): Promise<IEventDocument> {
    const event = new Event(data);
    return await event.save();
  }

  /**
   * Find a single event by ID and tenant ID
   */
  public async findById(id: string, tenantId: string): Promise<IEventDocument | null> {
    return await Event.findOne({ _id: id, tenantId }).exec();
  }

  /**
   * Find a single event by Slug and tenant ID
   */
  public async findBySlug(slug: string, tenantId: string): Promise<IEventDocument | null> {
    return await Event.findOne({ slug, tenantId }).exec();
  }

  /**
   * Update an existing event
   */
  public async update(
    id: string,
    tenantId: string,
    updateData: Partial<IEvent>
  ): Promise<IEventDocument | null> {
    return await Event.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * Delete an event
   */
  public async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await Event.deleteOne({ _id: id, tenantId }).exec();
    return result.deletedCount > 0;
  }

  /**
   * Find and paginate events based on search, status, category, tags, and date range filters
   */
  public async findAll(
    tenantId: string,
    filters: IEventFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<IPaginatedResult<IEventDocument>> {
    const query: any = { tenantId };

    // 1. Text Search or regex fallback
    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    // 2. Category filtering
    if (filters.category) {
      query.category = filters.category;
    }

    // 3. Status filtering
    if (filters.status) {
      query.status = filters.status;
    }

    // 4. Visibility filtering
    if (filters.visibility) {
      query.visibility = filters.visibility;
    }

    // 5. Tags matching (matching all or any - let's match all of them)
    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $all: filters.tags };
    }

    // 6. Date Range Filtering
    if (filters.startDate || filters.endDate) {
      query['schedule.startDate'] = {};
      if (filters.startDate) {
        query['schedule.startDate'].$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query['schedule.startDate'].$lte = new Date(filters.endDate);
      }
    }

    // Perform query count
    const total = await Event.countDocuments(query).exec();
    
    const skip = (page - 1) * limit;
    
    // Read documents
    let dbQuery = Event.find(query);
    
    // If text search was requested, sort by text score relevance
    if (filters.search) {
      dbQuery = dbQuery
        .select({ score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } });
    } else {
      // Default to newest first
      dbQuery = dbQuery.sort({ 'schedule.startDate': 1, createdAt: -1 });
    }

    const docs = await dbQuery.skip(skip).limit(limit).exec();
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      docs,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Extract all categories active inside the tenant
   */
  public async getCategories(tenantId: string): Promise<string[]> {
    return await Event.distinct('category', { tenantId }).exec();
  }

  /**
   * Extract all tags active inside the tenant
   */
  public async getTags(tenantId: string): Promise<string[]> {
    return await Event.distinct('tags', { tenantId }).exec();
  }
}
export const eventRepository = new EventRepository();

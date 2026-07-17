import { Request, Response, NextFunction } from 'express';
import { eventService } from '../services/EventService';
import { ApiResponse } from '../utils/response';
import { EventStatus, EventVisibility, IUserIdentity } from '../types';
import { ValidationError } from '../errors/AppError';

export class EventController {
  /**
   * Create Event Handler
   */
  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const user = req.user as IUserIdentity;
      
      const event = await eventService.createEvent(tenantId, user, req.body);
      
      ApiResponse.success(res, event, 201, {
        message: 'Event core resource established successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Event by ID Handler
   */
  public async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      
      const event = await eventService.getEventById(id, tenantId);
      
      ApiResponse.success(res, event, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Event by Slug Handler
   */
  public async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { slug } = req.params;
      
      const event = await eventService.getEventBySlug(slug, tenantId);
      
      ApiResponse.success(res, event, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update Event Handler
   */
  public async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const user = req.user as IUserIdentity;
      
      const event = await eventService.updateEvent(id, tenantId, user, req.body);
      
      ApiResponse.success(res, event, 200, {
        message: 'Event core resource updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete Event Handler
   */
  public async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const user = req.user as IUserIdentity;
      
      await eventService.deleteEvent(id, tenantId, user);
      
      ApiResponse.success(res, { id }, 200, {
        message: 'Event core resource deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Publish Event Handler
   */
  public async publish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const user = req.user as IUserIdentity;
      
      const event = await eventService.publishEvent(id, tenantId, user);
      
      ApiResponse.success(res, event, 200, {
        message: 'Event published to public ledger channels',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel Event Handler
   */
  public async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const user = req.user as IUserIdentity;
      
      const event = await eventService.cancelEvent(id, tenantId, user);
      
      ApiResponse.success(res, event, 200, {
        message: 'Event status updated to CANCELLED',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List Events Handler (Paginated + Filtered)
   */
  public async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      
      const search = req.query.search as string;
      const category = req.query.category as string;
      const status = req.query.status as EventStatus;
      const visibility = req.query.visibility as EventVisibility;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      
      // Parse tags (support format ?tags=tech,education or ?tags[]=tech)
      let tags: string[] | undefined;
      if (req.query.tags) {
        if (typeof req.query.tags === 'string') {
          tags = req.query.tags.split(',').map((t) => t.trim()).filter(Boolean);
        } else if (Array.isArray(req.query.tags)) {
          tags = (req.query.tags as string[]).map((t) => t.trim()).filter(Boolean);
        }
      }

      const filters = {
        search,
        category,
        status,
        visibility,
        tags,
        startDate,
        endDate,
      };

      const result = await eventService.getEvents(tenantId, filters, page, limit);
      
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
   * Get Categories list active in tenant
   */
  public async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const categories = await eventService.getCategories(tenantId);
      ApiResponse.success(res, categories);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Tags list active in tenant
   */
  public async getTags(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const tags = await eventService.getTags(tenantId);
      ApiResponse.success(res, tags);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch Audit Logs for security auditing
   */
  public async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const logs = await eventService.getAuditLogs(tenantId);
      ApiResponse.success(res, logs);
    } catch (error) {
      next(error);
    }
  }
}

export const eventController = new EventController();

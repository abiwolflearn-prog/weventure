import { eventRepository, IEventFilters, IPaginatedResult } from '../repositories/EventRepository';
import { AuditLog } from '../models/AuditLog';
import { IEventDocument } from '../models/Event';
import { EventStatus, EventVisibility, IEvent, IUserIdentity } from '../types';
import { AppError, ValidationError, NotFoundError, ConflictError } from '../errors/AppError';
import { subscriptionService } from './SubscriptionService';

export class EventService {
  /**
   * Helper to write an enterprise Audit Log entry
   */
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
        resourceType: 'EVENT',
        resourceId,
        details,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      // Don't crash request if audit logging fails, but log it
      console.error('Audit logging failed:', err);
    }
  }

  /**
   * Coherent slug generator with conflict suffix resolution
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private async getUniqueSlug(tenantId: string, title: string, excludeEventId?: string): Promise<string> {
    const baseSlug = this.generateSlug(title) || 'event';
    let slug = baseSlug;
    let count = 1;

    while (true) {
      const existing = await eventRepository.findBySlug(slug, tenantId);
      if (!existing || (excludeEventId && existing.id === excludeEventId)) {
        break;
      }
      slug = `${baseSlug}-${count}`;
      count++;
    }

    return slug;
  }

  /**
   * Validates event parameters for timing, registration limits, and multi-sessions
   */
  private validateEventData(data: Partial<IEvent>): void {
    const start = data.schedule?.startDate ? new Date(data.schedule.startDate) : null;
    const end = data.schedule?.endDate ? new Date(data.schedule.endDate) : null;

    if (start && end && start >= end) {
      throw new ValidationError('Event start date must be strictly earlier than end date');
    }

    if (data.capacity) {
      const { maxCapacity, isUnlimited } = data.capacity;
      if (!isUnlimited && (maxCapacity === undefined || maxCapacity < 1)) {
        throw new ValidationError('Capacity limit must be at least 1 unless set as unlimited');
      }
    }

    if (data.registrationSettings) {
      const regOpen = data.registrationSettings.registrationOpenDate 
        ? new Date(data.registrationSettings.registrationOpenDate) 
        : null;
      const regClose = data.registrationSettings.registrationCloseDate 
        ? new Date(data.registrationSettings.registrationCloseDate) 
        : null;

      if (regOpen && regClose && regOpen >= regClose) {
        throw new ValidationError('Registration open date must be earlier than registration close date');
      }
      if (regClose && end && regClose > end) {
        throw new ValidationError('Registration close date cannot be later than event end date');
      }
    }

    // Sessions Timing Validation
    if (data.sessions && data.sessions.length > 0) {
      data.sessions.forEach((session, index) => {
        const sStart = new Date(session.startTime);
        const sEnd = new Date(session.endTime);

        if (sStart >= sEnd) {
          throw new ValidationError(`Session [Index ${index}: "${session.title}"] has invalid times: Start must precede End`);
        }

        if (start && sStart < start) {
          throw new ValidationError(`Session [Index ${index}: "${session.title}"] starts before the main event scheduled start`);
        }

        if (end && sEnd > end) {
          throw new ValidationError(`Session [Index ${index}: "${session.title}"] extends beyond the main event scheduled end`);
        }
      });
    }
  }

  /**
   * Helper to fetch default modules configuration based on event template
   */
  private getDefaultModulesForTemplate(template: string = 'default'): { id: string; enabled: boolean; config: any }[] {
    const allModuleIds = [
      'registration', 'ticketing', 'agenda', 'speakers', 'sponsors',
      'exhibitors', 'certificates', 'workspaceBooking', 'community', 'networking',
      'surveys', 'feedback', 'marketing', 'automation', 'analytics',
      'aiAssistant', 'liveStreaming', 'photoGallery', 'mobileApp', 'integrations'
    ];

    let enabledIds: string[] = ['registration', 'agenda'];

    switch (template) {
      case 'conference':
        enabledIds = ['registration', 'ticketing', 'agenda', 'speakers', 'sponsors', 'exhibitors', 'certificates', 'networking', 'marketing', 'analytics'];
        break;
      case 'webinar':
        enabledIds = ['registration', 'agenda', 'speakers', 'surveys', 'aiAssistant', 'liveStreaming', 'marketing', 'analytics', 'integrations'];
        break;
      case 'workshop':
        enabledIds = ['registration', 'ticketing', 'agenda', 'speakers', 'certificates', 'workspaceBooking', 'feedback', 'analytics'];
        break;
      case 'hackathon':
        enabledIds = ['registration', 'agenda', 'community', 'networking', 'surveys', 'marketing', 'aiAssistant', 'photoGallery', 'integrations'];
        break;
      case 'expo':
        enabledIds = ['registration', 'ticketing', 'agenda', 'sponsors', 'exhibitors', 'workspaceBooking', 'marketing', 'analytics', 'mobileApp', 'integrations'];
        break;
      case 'meetup':
        enabledIds = ['registration', 'agenda', 'workspaceBooking', 'community', 'networking', 'feedback', 'photoGallery'];
        break;
      default:
        enabledIds = ['registration', 'agenda'];
        break;
    }

    return allModuleIds.map(id => ({
      id,
      enabled: enabledIds.includes(id),
      config: {}
    }));
  }

  /**
   * Create Event Core Entry
   */
  public async createEvent(
    tenantId: string,
    user: IUserIdentity,
    eventPayload: Omit<IEvent, 'id' | 'tenantId' | 'createdBy' | 'createdAt' | 'updatedAt'>
  ): Promise<IEventDocument> {
    this.validateEventData(eventPayload);

    // Subscription Limit Check
    const currentUsage = await subscriptionService.syncUsageCounts(tenantId);
    const limitCheck = await subscriptionService.checkLimitExceeded(tenantId, 'maxEvents', currentUsage.eventsCount + 1);
    if (limitCheck.exceeded) {
      throw new ValidationError(`Event creation blocked: Your current subscription plan only permits up to ${limitCheck.limit} active events. Please upgrade your subscription to create more.`);
    }

    const slug = await this.getUniqueSlug(tenantId, eventPayload.title);

    const template = eventPayload.template || 'default';
    const modules = eventPayload.modules && eventPayload.modules.length > 0
      ? eventPayload.modules
      : this.getDefaultModulesForTemplate(template);

    const fullPayload: Partial<IEvent> = {
      ...eventPayload,
      tenantId,
      slug,
      template,
      modules,
      status: eventPayload.status || EventStatus.DRAFT,
      visibility: eventPayload.visibility || EventVisibility.PUBLIC,
      createdBy: user.id,
      capacity: {
        maxCapacity: eventPayload.capacity?.isUnlimited ? 0 : (eventPayload.capacity?.maxCapacity || 0),
        activeRegistrations: 0,
        isUnlimited: eventPayload.capacity?.isUnlimited || false,
      },
    };

    const createdEvent = await eventRepository.create(fullPayload);
    await subscriptionService.incrementUsage(tenantId, 'eventsCount', 1);

    // Audit Logging
    await this.logActivity(tenantId, user, 'CREATE_EVENT', createdEvent.id, {
      title: createdEvent.title,
      status: createdEvent.status,
      category: createdEvent.category,
    });

    return createdEvent;
  }

  /**
   * Fetch Single Event by ID
   */
  public async getEventById(id: string, tenantId: string): Promise<IEventDocument> {
    const event = await eventRepository.findById(id, tenantId);
    if (!event) {
      throw new NotFoundError(`Event with ID '${id}' not found inside this workspace isolation context.`);
    }
    return event;
  }

  /**
   * Fetch Single Event by Slug
   */
  public async getEventBySlug(slug: string, tenantId: string): Promise<IEventDocument> {
    const event = await eventRepository.findBySlug(slug, tenantId);
    if (!event) {
      throw new NotFoundError(`Event with slug '${slug}' not found inside this workspace isolation context.`);
    }
    return event;
  }

  /**
   * Update Event Core parameters
   */
  public async updateEvent(
    id: string,
    tenantId: string,
    user: IUserIdentity,
    updatePayload: Partial<IEvent>
  ): Promise<IEventDocument> {
    const existingEvent = await this.getEventById(id, tenantId);

    // Check permissions (Only Creators or Admins/Staff can update)
    const canUpdate = 
      existingEvent.createdBy === user.id || 
      user.role === 'SUPER_ADMIN' || 
      user.role === 'TENANT_ADMIN' || 
      user.role === 'STAFF';

    if (!canUpdate) {
      throw new AppError('You do not possess the required ownership permissions to modify this event', 403, 'FORBIDDEN');
    }

    // Merge nested subdocuments to prevent overwriting missing fields
    const existing = existingEvent.toObject();

    if (updatePayload.capacity) {
      updatePayload.capacity = {
        ...existing.capacity,
        ...updatePayload.capacity,
      };
    }
    if (updatePayload.schedule) {
      updatePayload.schedule = {
        ...existing.schedule,
        ...updatePayload.schedule,
      };
    }
    if (updatePayload.registrationSettings) {
      updatePayload.registrationSettings = {
        ...existing.registrationSettings,
        ...updatePayload.registrationSettings,
      };
    }
    if (updatePayload.media) {
      updatePayload.media = {
        ...existing.media,
        ...updatePayload.media,
      };
    }
    if (updatePayload.seo) {
      updatePayload.seo = {
        ...existing.seo,
        ...updatePayload.seo,
      };
    }

    this.validateEventData(updatePayload);

    // Recompute slug if title is updated
    if (updatePayload.title && updatePayload.title !== existingEvent.title) {
      updatePayload.slug = await this.getUniqueSlug(tenantId, updatePayload.title, id);
    } else {
      delete updatePayload.slug; // Prevent overwriting slug accidentally
    }

    // Secure payload changes
    delete updatePayload.createdBy;
    delete updatePayload.tenantId;

    const updatedEvent = await eventRepository.update(id, tenantId, updatePayload);
    if (!updatedEvent) {
      throw new NotFoundError(`Event with ID '${id}' not found for updating`);
    }

    // Audit Log
    await this.logActivity(tenantId, user, 'UPDATE_EVENT', id, {
      updatedFields: Object.keys(updatePayload),
      title: updatedEvent.title,
    });

    return updatedEvent;
  }

  /**
   * Delete Event
   */
  public async deleteEvent(id: string, tenantId: string, user: IUserIdentity): Promise<void> {
    const existingEvent = await this.getEventById(id, tenantId);

    const canDelete = 
      existingEvent.createdBy === user.id || 
      user.role === 'SUPER_ADMIN' || 
      user.role === 'TENANT_ADMIN';

    if (!canDelete) {
      throw new AppError('You do not possess the required authority to delete this event', 403, 'FORBIDDEN');
    }

    await eventRepository.delete(id, tenantId);
    await subscriptionService.incrementUsage(tenantId, 'eventsCount', -1);

    // Audit Log
    await this.logActivity(tenantId, user, 'DELETE_EVENT', id, {
      title: existingEvent.title,
      category: existingEvent.category,
    });
  }

  /**
   * Publish a draft Event
   */
  public async publishEvent(id: string, tenantId: string, user: IUserIdentity): Promise<IEventDocument> {
    const event = await this.getEventById(id, tenantId);
    
    if (event.status === EventStatus.PUBLISHED) {
      throw new ConflictError('Event is already published.');
    }

    event.status = EventStatus.PUBLISHED;
    const updated = await event.save();

    await this.logActivity(tenantId, user, 'PUBLISH_EVENT', id, { title: event.title });
    return updated;
  }

  /**
   * Cancel an Event
   */
  public async cancelEvent(id: string, tenantId: string, user: IUserIdentity): Promise<IEventDocument> {
    const event = await this.getEventById(id, tenantId);

    if (event.status === EventStatus.CANCELLED) {
      throw new ConflictError('Event is already cancelled.');
    }

    event.status = EventStatus.CANCELLED;
    const updated = await event.save();

    await this.logActivity(tenantId, user, 'CANCEL_EVENT', id, { title: event.title });
    return updated;
  }

  /**
   * Get all Events (Paginated & Filtered)
   */
  public async getEvents(
    tenantId: string,
    filters: IEventFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<IPaginatedResult<IEventDocument>> {
    return await eventRepository.findAll(tenantId, filters, page, limit);
  }

  /**
   * Get all active categories in the tenant
   */
  public async getCategories(tenantId: string): Promise<string[]> {
    return await eventRepository.getCategories(tenantId);
  }

  /**
   * Get all active tags in the tenant
   */
  public async getTags(tenantId: string): Promise<string[]> {
    return await eventRepository.getTags(tenantId);
  }

  /**
   * Fetch event logs for tenant
   */
  public async getAuditLogs(tenantId: string, limit: number = 20): Promise<any[]> {
    return await AuditLog.find({ tenantId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }
}

export const eventService = new EventService();

import { axiosInstance } from './axiosInstance';
import { 
  IApiResponseSingle, 
  IApiResponsePaginated, 
  IEvent, 
  EventStatus, 
  EventVisibility,
  IAuditLog
} from '../types';

export interface IGetEventsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: EventStatus | '';
  visibility?: EventVisibility | '';
  tags?: string[];
  startDate?: string;
  endDate?: string;
}

export const eventApi = {
  /**
   * Fetch paginated and filtered events list
   */
  async getEvents(params: IGetEventsParams = {}): Promise<IApiResponsePaginated<IEvent>> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.search) queryParams.set('search', params.search);
    if (params.category) queryParams.set('category', params.category);
    if (params.status) queryParams.set('status', params.status);
    if (params.visibility) queryParams.set('visibility', params.visibility);
    if (params.startDate) queryParams.set('startDate', params.startDate);
    if (params.endDate) queryParams.set('endDate', params.endDate);
    
    if (params.tags && params.tags.length > 0) {
      queryParams.set('tags', params.tags.join(','));
    }

    const { data } = await axiosInstance.get<IApiResponsePaginated<IEvent>>(`/events?${queryParams.toString()}`);
    return data;
  },

  /**
   * Retrieve event details by technical ID
   */
  async getEventById(id: string): Promise<IApiResponseSingle<IEvent>> {
    const { data } = await axiosInstance.get<IApiResponseSingle<IEvent>>(`/events/id/${id}`);
    return data;
  },

  /**
   * Retrieve event details by friendly URL Slug
   */
  async getEventBySlug(slug: string): Promise<IApiResponseSingle<IEvent>> {
    const { data } = await axiosInstance.get<IApiResponseSingle<IEvent>>(`/events/slug/${slug}`);
    return data;
  },

  /**
   * Create a new core event draft/published page
   */
  async createEvent(payload: Omit<IEvent, 'id' | 'tenantId' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<IApiResponseSingle<IEvent>> {
    const { data } = await axiosInstance.post<IApiResponseSingle<IEvent>>('/events', payload);
    return data;
  },

  /**
   * Modify specifications of an existing event
   */
  async updateEvent(id: string, payload: Partial<IEvent>): Promise<IApiResponseSingle<IEvent>> {
    const { data } = await axiosInstance.put<IApiResponseSingle<IEvent>>(`/events/${id}`, payload);
    return data;
  },

  /**
   * Securely purge/delete an event
   */
  async deleteEvent(id: string): Promise<IApiResponseSingle<{ id: string }>> {
    const { data } = await axiosInstance.delete<IApiResponseSingle<{ id: string }>>(`/events/${id}`);
    return data;
  },

  /**
   * Publish a draft event
   */
  async publishEvent(id: string): Promise<IApiResponseSingle<IEvent>> {
    const { data } = await axiosInstance.patch<IApiResponseSingle<IEvent>>(`/events/${id}/publish`);
    return data;
  },

  /**
   * Cancel an event
   */
  async cancelEvent(id: string): Promise<IApiResponseSingle<IEvent>> {
    const { data } = await axiosInstance.patch<IApiResponseSingle<IEvent>>(`/events/${id}/cancel`);
    return data;
  },

  /**
   * Retrieve distinct categories
   */
  async getCategories(): Promise<IApiResponseSingle<string[]>> {
    const { data } = await axiosInstance.get<IApiResponseSingle<string[]>>('/events/categories');
    return data;
  },

  /**
   * Retrieve distinct tags
   */
  async getTags(): Promise<IApiResponseSingle<string[]>> {
    const { data } = await axiosInstance.get<IApiResponseSingle<string[]>>('/events/tags');
    return data;
  },

  /**
   * Retrieve audit logs
   */
  async getAuditLogs(): Promise<IApiResponseSingle<IAuditLog[]>> {
    const { data } = await axiosInstance.get<IApiResponseSingle<IAuditLog[]>>('/events/logs');
    return data;
  }
};

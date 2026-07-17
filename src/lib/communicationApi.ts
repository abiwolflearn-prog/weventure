import { axiosInstance } from './axiosInstance';

export interface IAPINotification {
  id: string;
  tenantId: string;
  userId: string;
  title: string;
  message: string;
  category: 'EVENT' | 'BOOKING' | 'PAYMENT' | 'ANNOUNCEMENT' | 'SYSTEM';
  isRead: boolean;
  readAt?: string;
  link?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IAPIActivity {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: Record<string, any>;
  createdAt: string;
}

export interface IAPIAnnouncement {
  id: string;
  tenantId: string;
  title: string;
  content: string;
  targetAudience: 'ALL' | 'HUB_MEMBER' | 'STAFF' | 'EXTERNAL_USER';
  scheduledFor?: string;
  isPublished: boolean;
  createdBy: string;
  createdAt: string;
}

export const communicationApi = {
  /**
   * Fetch user notifications
   */
  getNotifications: async (limit = 50): Promise<IAPINotification[]> => {
    const response = await axiosInstance.get(`/communications/notifications?limit=${limit}`);
    return response.data.data;
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: async (id: string): Promise<IAPINotification> => {
    const response = await axiosInstance.patch(`/communications/notifications/${id}/read`);
    return response.data.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<{ count: number }> => {
    const response = await axiosInstance.post('/communications/read-all');
    return response.data.data;
  },

  /**
   * Fetch timeline activities
   */
  getActivities: async (limit = 50): Promise<IAPIActivity[]> => {
    const response = await axiosInstance.get(`/communications/activities?limit=${limit}`);
    return response.data.data;
  },

  /**
   * Fetch active published announcements
   */
  getAnnouncements: async (limit = 20): Promise<IAPIAnnouncement[]> => {
    const response = await axiosInstance.get(`/communications/announcements?limit=${limit}`);
    return response.data.data;
  },

  /**
   * Create an announcement (Admin/Staff only)
   */
  createAnnouncement: async (payload: {
    title: string;
    content: string;
    targetAudience: 'ALL' | 'HUB_MEMBER' | 'STAFF' | 'EXTERNAL_USER';
    scheduledFor?: string;
    sendEmail?: boolean;
    memberEmails?: string[];
  }): Promise<IAPIAnnouncement> => {
    const response = await axiosInstance.post('/communications/announcements', payload);
    return response.data.data;
  },
};

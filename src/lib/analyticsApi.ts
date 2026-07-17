import { axiosInstance } from './axiosInstance';
import {
  IDashboardSummary,
  IEventMetrics,
  IBookingMetrics,
  IRevenueMetrics,
  IUserMetrics,
  IWorkspaceMetrics,
} from '../types/analytics';

export interface IAnalyticsQueryParams {
  range?: string;
  startDate?: string;
  endDate?: string;
}

export const analyticsApi = {
  getSummary: async (params?: IAnalyticsQueryParams): Promise<IDashboardSummary> => {
    const response = await axiosInstance.get('/dashboard/overview', { params });
    return response.data.data;
  },

  getEvents: async (params?: IAnalyticsQueryParams): Promise<IEventMetrics> => {
    const response = await axiosInstance.get('/dashboard/events', { params });
    return response.data.data;
  },

  getBookings: async (params?: IAnalyticsQueryParams): Promise<IBookingMetrics> => {
    const response = await axiosInstance.get('/dashboard/bookings', { params });
    return response.data.data;
  },

  getRevenue: async (params?: IAnalyticsQueryParams): Promise<IRevenueMetrics> => {
    const response = await axiosInstance.get('/dashboard/revenue', { params });
    return response.data.data;
  },

  getUsers: async (params?: IAnalyticsQueryParams): Promise<IUserMetrics> => {
    const response = await axiosInstance.get('/dashboard/registrations', { params });
    return response.data.data;
  },

  getWorkspaces: async (params?: IAnalyticsQueryParams): Promise<IWorkspaceMetrics> => {
    const response = await axiosInstance.get('/dashboard/workspaces', { params });
    return response.data.data;
  },
};

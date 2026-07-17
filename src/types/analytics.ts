/**
 * WeVentureHub Analytics & Business Intelligence Type Definitions
 */

export interface IKpiCard {
  title: string;
  value: number;
  unit?: string;
  change: number; // percentage growth/decline
  trend: 'up' | 'down' | 'neutral';
  description?: string;
}

export interface IDashboardSummary {
  revenue: IKpiCard;
  bookings: IKpiCard;
  registrations: IKpiCard;
  activeUsers: IKpiCard;
  events: IKpiCard;
  workspaceUtilization: IKpiCard;
}

export interface IEventStatusCount {
  status: string;
  count: number;
}

export interface IEventCategoryCount {
  category: string;
  count: number;
}

export interface ITopEvent {
  id: string;
  title: string;
  category: string;
  ticketsSold: number;
  totalRevenue: number;
}

export interface IEventMetrics {
  totalEvents: number;
  eventsByStatus: IEventStatusCount[];
  eventsByCategory: IEventCategoryCount[];
  topEvents: ITopEvent[];
}

export interface IBookingStatusCount {
  status: string;
  count: number;
}

export interface IBookingSpaceTypeMetric {
  spaceType: string;
  count: number;
  revenue: number;
}

export interface IBookingMetrics {
  totalBookings: number;
  bookingsByStatus: IBookingStatusCount[];
  bookingsBySpaceType: IBookingSpaceTypeMetric[];
  averageDurationHours: number;
  totalHoursBooked: number;
}

export interface IRevenueTimelineItem {
  date: string;
  ticketRevenue: number;
  bookingRevenue: number;
  totalRevenue: number;
}

export interface IRevenueMetrics {
  totalRevenue: number;
  ticketRevenue: number;
  bookingRevenue: number;
  revenueTimeline: IRevenueTimelineItem[];
}

export interface IUserTimelineItem {
  date: string;
  count: number;
}

export interface ITopUser {
  email: string;
  userId: string;
  bookingCount: number;
  totalSpent: number;
}

export interface IUserMetrics {
  totalActiveUsers: number;
  registrationTrend: IUserTimelineItem[];
  checkInRate: number;
  topUsers: ITopUser[];
}

export interface IWorkspaceTypeCount {
  type: string;
  count: number;
}

export interface ITopWorkspace {
  id: string;
  name: string;
  type: string;
  bookingCount: number;
  totalRevenue: number;
}

export interface IWorkspaceMetrics {
  totalWorkspaces: number;
  workspacesByType: IWorkspaceTypeCount[];
  topWorkspaces: ITopWorkspace[];
}

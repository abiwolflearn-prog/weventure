import { Booking } from '../models/Booking';
import { Event } from '../models/Event';
import { Order } from '../models/Order';
import { Registration } from '../models/Registration';
import { Workspace } from '../models/Workspace';
import { RegistrationStatus } from '../types';
import {
  IDashboardSummary,
  IEventMetrics,
  IBookingMetrics,
  IRevenueMetrics,
  IUserMetrics,
  IWorkspaceMetrics,
  IKpiCard,
} from '../types/analytics';
import { logger } from '../utils/logger';

export class AnalyticsService {
  /**
   * Parse date range configurations to return current and comparative previous periods.
   */
  private getPeriodDates(range: string, customStart?: string, customEnd?: string) {
    const now = new Date();
    let startDate = new Date();
    let prevStartDate = new Date();
    let prevEndDate = new Date();

    if (customStart && customEnd) {
      startDate = new Date(customStart);
      const endDate = new Date(customEnd);
      const durationMs = endDate.getTime() - startDate.getTime();
      prevStartDate = new Date(startDate.getTime() - durationMs);
      prevEndDate = new Date(startDate.getTime());
      return { startDate, endDate, prevStartDate, prevEndDate };
    }

    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        prevStartDate.setDate(now.getDate() - 14);
        prevEndDate.setDate(now.getDate() - 7);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        prevStartDate.setDate(now.getDate() - 180);
        prevEndDate.setDate(now.getDate() - 90);
        break;
      case '12m':
        startDate.setMonth(now.getMonth() - 12);
        prevStartDate.setMonth(now.getMonth() - 24);
        prevEndDate.setMonth(now.getMonth() - 12);
        break;
      case 'all':
        startDate = new Date(0); // Epoch start
        prevStartDate = new Date(0);
        prevEndDate = new Date(0);
        break;
      case '30d':
      default:
        startDate.setDate(now.getDate() - 30);
        prevStartDate.setDate(now.getDate() - 60);
        prevEndDate.setDate(now.getDate() - 30);
        break;
    }

    return { startDate, endDate: now, prevStartDate, prevEndDate };
  }

  /**
   * Helper to calculate percentage growth trend
   */
  private calculateGrowth(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 1000) / 10;
  }

  /**
   * Helper to resolve trend direction
   */
  private getTrend(change: number): 'up' | 'down' | 'neutral' {
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'neutral';
  }

  /**
   * Fetch unique active users count across bookings and registrations
   */
  private async getUniqueUsersCount(
    tenantId: string,
    start: Date,
    end: Date
  ): Promise<number> {
    try {
      const usersFromBookings = await Booking.distinct('userId', {
        tenantId,
        startTime: { $gte: start, $lte: end },
        status: 'CONFIRMED',
      });
      const usersFromRegistrations = await Registration.distinct('userId', {
        tenantId,
        registrationDate: { $gte: start, $lte: end },
        status: RegistrationStatus.CONFIRMED,
      });

      const allUsers = new Set([...usersFromBookings, ...usersFromRegistrations]);
      return allUsers.size;
    } catch (err) {
      logger.error('Error fetching unique users count for analytics:', err);
      return 0;
    }
  }

  /**
   * 1. Dashboard Overview Summary (High-Level KPIs with growth comparison)
   */
  public async getDashboardSummary(
    tenantId: string,
    range: string,
    customStart?: string,
    customEnd?: string
  ): Promise<IDashboardSummary> {
    const { startDate, endDate, prevStartDate, prevEndDate } = this.getPeriodDates(
      range,
      customStart,
      customEnd
    );

    logger.info(`Calculating dashboard summary for tenant [${tenantId}] over range [${range}]`);

    // --- REVENUE ---
    // Ticket sales revenue
    const [currentTicketRev, prevTicketRev] = await Promise.all([
      Order.aggregate([
        { $match: { tenantId, status: 'COMPLETED', orderDate: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        { $match: { tenantId, status: 'COMPLETED', orderDate: { $gte: prevStartDate, $lte: prevEndDate } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    // Space booking revenue
    const [currentBookingRev, prevBookingRev] = await Promise.all([
      Booking.aggregate([
        { $match: { tenantId, status: 'CONFIRMED', startTime: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Booking.aggregate([
        { $match: { tenantId, status: 'CONFIRMED', startTime: { $gte: prevStartDate, $lte: prevEndDate } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    const curTicketTotal = currentTicketRev[0]?.total || 0;
    const prevTicketTotal = prevTicketRev[0]?.total || 0;
    const curBookingTotal = currentBookingRev[0]?.total || 0;
    const prevBookingTotal = prevBookingRev[0]?.total || 0;

    const currentRevenue = curTicketTotal + curBookingTotal;
    const prevRevenue = prevTicketTotal + prevBookingTotal;
    const revChange = this.calculateGrowth(currentRevenue, prevRevenue);

    // --- BOOKINGS ---
    const [currentBookingsCount, prevBookingsCount] = await Promise.all([
      Booking.countDocuments({ tenantId, status: 'CONFIRMED', startTime: { $gte: startDate, $lte: endDate } }),
      Booking.countDocuments({ tenantId, status: 'CONFIRMED', startTime: { $gte: prevStartDate, $lte: prevEndDate } }),
    ]);
    const bookingChange = this.calculateGrowth(currentBookingsCount, prevBookingsCount);

    // --- REGISTRATIONS ---
    const [currentRegCount, prevRegCount] = await Promise.all([
      Registration.countDocuments({ tenantId, status: RegistrationStatus.CONFIRMED, registrationDate: { $gte: startDate, $lte: endDate } }),
      Registration.countDocuments({ tenantId, status: RegistrationStatus.CONFIRMED, registrationDate: { $gte: prevStartDate, $lte: prevEndDate } }),
    ]);
    const regChange = this.calculateGrowth(currentRegCount, prevRegCount);

    // --- ACTIVE USERS ---
    const [currentActiveUsers, prevActiveUsers] = await Promise.all([
      this.getUniqueUsersCount(tenantId, startDate, endDate),
      this.getUniqueUsersCount(tenantId, prevStartDate, prevEndDate),
    ]);
    const userChange = this.calculateGrowth(currentActiveUsers, prevActiveUsers);

    // --- EVENTS ---
    const [currentEventsCount, prevEventsCount] = await Promise.all([
      Event.countDocuments({ tenantId, 'schedule.startDate': { $gte: startDate, $lte: endDate } }),
      Event.countDocuments({ tenantId, 'schedule.startDate': { $gte: prevStartDate, $lte: prevEndDate } }),
    ]);
    const eventChange = this.calculateGrowth(currentEventsCount, prevEventsCount);

    // --- WORKSPACE UTILIZATION ---
    // Formula: Total Hours Booked / Total Capacity Hours
    // Billed/booked hours in current range
    const currentHoursPipeline = await Booking.aggregate([
      { $match: { tenantId, status: 'CONFIRMED', startTime: { $gte: startDate, $lte: endDate } } },
      {
        $project: {
          durationHours: {
            $divide: [{ $subtract: ['$endTime', '$startTime'] }, 1000 * 60 * 60],
          },
        },
      },
      { $group: { _id: null, total: { $sum: '$durationHours' } } },
    ]);
    const prevHoursPipeline = await Booking.aggregate([
      { $match: { tenantId, status: 'CONFIRMED', startTime: { $gte: prevStartDate, $lte: prevEndDate } } },
      {
        $project: {
          durationHours: {
            $divide: [{ $subtract: ['$endTime', '$startTime'] }, 1000 * 60 * 60],
          },
        },
      },
      { $group: { _id: null, total: { $sum: '$durationHours' } } },
    ]);

    const activeWorkspacesCount = await Workspace.countDocuments({ tenantId, isDeleted: false, isAvailable: true });
    // Total potential operational hours (e.g. 12 hours a day, 30 days = 360 hours per workspace)
    // To present a reasonable, elegant percentage rate:
    const daysInPeriod = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const totalPotentialHours = activeWorkspacesCount * daysInPeriod * 12; // assume 12 active business hours daily

    const currentHours = currentHoursPipeline[0]?.total || 0;
    const prevHours = prevHoursPipeline[0]?.total || 0;

    const currentUtil = totalPotentialHours > 0 ? Math.min(100, Math.round((currentHours / totalPotentialHours) * 1000) / 10) : 0;
    const prevUtil = totalPotentialHours > 0 ? Math.min(100, Math.round((prevHours / totalPotentialHours) * 1000) / 10) : 0;
    const utilChange = this.calculateGrowth(currentUtil, prevUtil);

    return {
      revenue: {
        title: 'Total Revenue',
        value: Math.round(currentRevenue * 100) / 100,
        unit: 'USD',
        change: revChange,
        trend: this.getTrend(revChange),
        description: `Compared to prior ${range || '30 days'}`,
      },
      bookings: {
        title: 'Workspace Bookings',
        value: currentBookingsCount,
        change: bookingChange,
        trend: this.getTrend(bookingChange),
        description: `Billed space rentals`,
      },
      registrations: {
        title: 'Event Registrations',
        value: currentRegCount,
        change: regChange,
        trend: this.getTrend(regChange),
        description: `Confirmed ticket claims`,
      },
      activeUsers: {
        title: 'Active Members',
        value: currentActiveUsers,
        change: userChange,
        trend: this.getTrend(userChange),
        description: `Unique workspace users`,
      },
      events: {
        title: 'Hosted Events',
        value: currentEventsCount,
        change: eventChange,
        trend: this.getTrend(eventChange),
        description: `Events conducted`,
      },
      workspaceUtilization: {
        title: 'Space Utilization',
        value: currentUtil,
        unit: '%',
        change: utilChange,
        trend: this.getTrend(utilChange),
        description: `${Math.round(currentHours)} booked hours vs capacity`,
      },
    };
  }

  /**
   * 2. Event Metrics Dashboard Section
   */
  public async getEventMetrics(
    tenantId: string,
    range: string,
    customStart?: string,
    customEnd?: string
  ): Promise<IEventMetrics> {
    const { startDate, endDate } = this.getPeriodDates(range, customStart, customEnd);

    // Total Events count
    const totalEvents = await Event.countDocuments({
      tenantId,
      'schedule.startDate': { $gte: startDate, $lte: endDate },
    });

    // Events counts grouped by status
    const eventsByStatus = await Event.aggregate([
      { $match: { tenantId, 'schedule.startDate': { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
    ]);

    // Events counts grouped by category
    const eventsByCategory = await Event.aggregate([
      { $match: { tenantId, 'schedule.startDate': { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { _id: 0, category: '$_id', count: 1 } },
      { $sort: { count: -1 } },
    ]);

    // Top Performing Events (by ticket revenue + sold counts)
    const topEvents = await Order.aggregate([
      { $match: { tenantId, status: 'COMPLETED', orderDate: { $gte: startDate, $lte: endDate } } },
      {
        $lookup: {
          from: 'events',
          let: { eventIdStr: '$eventId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toString: '$_id' }, '$$eventIdStr'],
                },
              },
            },
          ],
          as: 'eventDetails',
        },
      },
      { $unwind: { path: '$eventDetails', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$eventId',
          title: { $first: { $ifNull: ['$eventDetails.title', 'Untitled Event'] } },
          category: { $first: { $ifNull: ['$eventDetails.category', 'Uncategorized'] } },
          ticketsSold: { $sum: { $sum: '$tickets.quantity' } },
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
      { $project: { _id: 0, id: '$_id', title: 1, category: 1, ticketsSold: 1, totalRevenue: 1 } },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
    ]);

    return {
      totalEvents,
      eventsByStatus,
      eventsByCategory,
      topEvents,
    };
  }

  /**
   * 3. Booking & Workspace Utilization Dashboard Section
   */
  public async getBookingMetrics(
    tenantId: string,
    range: string,
    customStart?: string,
    customEnd?: string
  ): Promise<IBookingMetrics> {
    const { startDate, endDate } = this.getPeriodDates(range, customStart, customEnd);

    // Total Bookings count
    const totalBookings = await Booking.countDocuments({
      tenantId,
      startTime: { $gte: startDate, $lte: endDate },
    });

    // Bookings grouped by status
    const bookingsByStatus = await Booking.aggregate([
      { $match: { tenantId, startTime: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
    ]);

    // Bookings grouped by Workspace Space Type
    const bookingsBySpaceType = await Booking.aggregate([
      { $match: { tenantId, startTime: { $gte: startDate, $lte: endDate } } },
      {
        $lookup: {
          from: 'workspaces',
          let: { spaceIdStr: '$spaceId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toString: '$_id' }, '$$spaceIdStr'],
                },
              },
            },
          ],
          as: 'spaceDetails',
        },
      },
      { $unwind: { path: '$spaceDetails', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$spaceDetails.type', 'UNKNOWN'] },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $project: { _id: 0, spaceType: '$_id', count: 1, revenue: 1 } },
      { $sort: { count: -1 } },
    ]);

    // Duration stats
    const durationStats = await Booking.aggregate([
      { $match: { tenantId, status: 'CONFIRMED', startTime: { $gte: startDate, $lte: endDate } } },
      {
        $project: {
          durationHours: {
            $divide: [{ $subtract: ['$endTime', '$startTime'] }, 1000 * 60 * 60],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalHours: { $sum: '$durationHours' },
          avgHours: { $avg: '$durationHours' },
        },
      },
    ]);

    const totalHoursBooked = Math.round((durationStats[0]?.totalHours || 0) * 10) / 10;
    const averageDurationHours = Math.round((durationStats[0]?.avgHours || 0) * 10) / 10;

    return {
      totalBookings,
      bookingsByStatus,
      bookingsBySpaceType,
      averageDurationHours,
      totalHoursBooked,
    };
  }

  /**
   * 4. Revenue Metrics (Sales segments and timeline graphs)
   */
  public async getRevenueMetrics(
    tenantId: string,
    range: string,
    customStart?: string,
    customEnd?: string
  ): Promise<IRevenueMetrics> {
    const { startDate, endDate } = this.getPeriodDates(range, customStart, customEnd);

    // Sum ticketing revenue
    const ticketRevenueRes = await Order.aggregate([
      { $match: { tenantId, status: 'COMPLETED', orderDate: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const ticketRevenue = ticketRevenueRes[0]?.total || 0;

    // Sum space booking revenue
    const bookingRevenueRes = await Booking.aggregate([
      { $match: { tenantId, status: 'CONFIRMED', startTime: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const bookingRevenue = bookingRevenueRes[0]?.total || 0;

    const totalRevenue = ticketRevenue + bookingRevenue;

    // Build timeline charts grouped daily
    const ticketTimeline = await Order.aggregate([
      { $match: { tenantId, status: 'COMPLETED', orderDate: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$orderDate' } },
          total: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const bookingTimeline = await Booking.aggregate([
      { $match: { tenantId, status: 'CONFIRMED', startTime: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
          total: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Combine timelines cleanly in memory
    const timelineMap: Record<string, { ticketRevenue: number; bookingRevenue: number }> = {};

    ticketTimeline.forEach((item) => {
      timelineMap[item._id] = { ticketRevenue: item.total, bookingRevenue: 0 };
    });

    bookingTimeline.forEach((item) => {
      if (timelineMap[item._id]) {
        timelineMap[item._id].bookingRevenue = item.total;
      } else {
        timelineMap[item._id] = { ticketRevenue: 0, bookingRevenue: item.total };
      }
    });

    const revenueTimeline = Object.entries(timelineMap)
      .map(([date, values]) => ({
        date,
        ticketRevenue: Math.round(values.ticketRevenue * 100) / 100,
        bookingRevenue: Math.round(values.bookingRevenue * 100) / 100,
        totalRevenue: Math.round((values.ticketRevenue + values.bookingRevenue) * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      ticketRevenue: Math.round(ticketRevenue * 100) / 100,
      bookingRevenue: Math.round(bookingRevenue * 100) / 100,
      revenueTimeline,
    };
  }

  /**
   * 5. User Metrics (Attendees, Registrations, Check-In rate, Busiest attendees)
   */
  public async getUserMetrics(
    tenantId: string,
    range: string,
    customStart?: string,
    customEnd?: string
  ): Promise<IUserMetrics> {
    const { startDate, endDate } = this.getPeriodDates(range, customStart, customEnd);

    // Total unique active users count
    const totalActiveUsers = await this.getUniqueUsersCount(tenantId, startDate, endDate);

    // Registration trend line (grouped daily)
    const registrations = await Registration.aggregate([
      { $match: { tenantId, registrationDate: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$registrationDate' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const registrationTrend = registrations.map((item) => ({
      date: item._id,
      count: item.count,
    }));

    // Check-In rate
    const ticketStats = await Registration.aggregate([
      { $match: { tenantId, registrationDate: { $gte: startDate, $lte: endDate }, status: 'CONFIRMED' } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          checkedIn: { $sum: { $cond: [{ $eq: ['$checkedIn', true] }, 1, 0] } },
        },
      },
    ]);

    const totalTickets = ticketStats[0]?.total || 0;
    const checkedInTickets = ticketStats[0]?.checkedIn || 0;
    const checkInRate = totalTickets > 0 ? Math.round((checkedInTickets / totalTickets) * 1000) / 10 : 0;

    // Top active platform customers / users (by booking/revenue volume)
    const topUsers = await Booking.aggregate([
      { $match: { tenantId, status: 'CONFIRMED', startTime: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: '$userEmail',
          userId: { $first: '$userId' },
          bookingCount: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
        },
      },
      { $project: { _id: 0, email: '$_id', userId: 1, bookingCount: 1, totalSpent: 1 } },
      { $sort: { bookingCount: -1 } },
      { $limit: 10 },
    ]);

    return {
      totalActiveUsers,
      registrationTrend,
      checkInRate,
      topUsers,
    };
  }

  /**
   * 6. Workspace Performance & Popularity
   */
  public async getWorkspaceMetrics(
    tenantId: string,
    range: string,
    customStart?: string,
    customEnd?: string
  ): Promise<IWorkspaceMetrics> {
    const { startDate, endDate } = this.getPeriodDates(range, customStart, customEnd);

    // Total Workspaces in the tenant
    const totalWorkspaces = await Workspace.countDocuments({
      tenantId,
      isDeleted: false,
    });

    // Workspaces count grouped by type
    const workspacesByType = await Workspace.aggregate([
      { $match: { tenantId, isDeleted: false } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $project: { _id: 0, type: '$_id', count: 1 } },
      { $sort: { count: -1 } },
    ]);

    // Top performing spaces by revenue & booking count
    const topWorkspaces = await Booking.aggregate([
      { $match: { tenantId, status: 'CONFIRMED', startTime: { $gte: startDate, $lte: endDate } } },
      {
        $lookup: {
          from: 'workspaces',
          let: { spaceIdStr: '$spaceId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toString: '$_id' }, '$$spaceIdStr'],
                },
              },
            },
          ],
          as: 'spaceDetails',
        },
      },
      { $unwind: { path: '$spaceDetails', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$spaceId',
          name: { $first: { $ifNull: ['$spaceDetails.name', 'Deleted Workspace'] } },
          type: { $first: { $ifNull: ['$spaceDetails.type', 'UNKNOWN'] } },
          bookingCount: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
      { $project: { _id: 0, id: '$_id', name: 1, type: 1, bookingCount: 1, totalRevenue: 1 } },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
    ]);

    return {
      totalWorkspaces,
      workspacesByType,
      topWorkspaces,
    };
  }
}

export const analyticsService = new AnalyticsService();

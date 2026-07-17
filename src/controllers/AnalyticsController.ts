import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/AnalyticsService';
import { ApiResponse } from '../utils/response';

export class AnalyticsController {
  /**
   * Helper to parse range, startDate, and endDate query params
   */
  private getQueryParams(req: Request) {
    const range = (req.query.range as string) || '30d';
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    return { range, startDate, endDate };
  }

  /**
   * GET /api/v1/analytics/summary
   * High-level KPI cards with growth trends
   */
  public getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId!;
      const { range, startDate, endDate } = this.getQueryParams(req);

      const summary = await analyticsService.getDashboardSummary(
        tenantId,
        range,
        startDate,
        endDate
      );

      ApiResponse.success(res, summary, 200, {
        range,
        filtered: !!(startDate && endDate),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/analytics/events
   * Detailed event metrics
   */
  public getEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId!;
      const { range, startDate, endDate } = this.getQueryParams(req);

      const metrics = await analyticsService.getEventMetrics(
        tenantId,
        range,
        startDate,
        endDate
      );

      ApiResponse.success(res, metrics, 200, { range });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/analytics/bookings
   * Detailed booking & workspace utilization metrics
   */
  public getBookings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId!;
      const { range, startDate, endDate } = this.getQueryParams(req);

      const metrics = await analyticsService.getBookingMetrics(
        tenantId,
        range,
        startDate,
        endDate
      );

      ApiResponse.success(res, metrics, 200, { range });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/analytics/revenue
   * Detailed revenue timelines and segmentations
   */
  public getRevenue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId!;
      const { range, startDate, endDate } = this.getQueryParams(req);

      const metrics = await analyticsService.getRevenueMetrics(
        tenantId,
        range,
        startDate,
        endDate
      );

      ApiResponse.success(res, metrics, 200, { range });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/analytics/users
   * Detailed user registration and engagement metrics
   */
  public getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId!;
      const { range, startDate, endDate } = this.getQueryParams(req);

      const metrics = await analyticsService.getUserMetrics(
        tenantId,
        range,
        startDate,
        endDate
      );

      ApiResponse.success(res, metrics, 200, { range });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/analytics/workspaces
   * Detailed workspace performance ranking and counts
   */
  public getWorkspaces = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId!;
      const { range, startDate, endDate } = this.getQueryParams(req);

      const metrics = await analyticsService.getWorkspaceMetrics(
        tenantId,
        range,
        startDate,
        endDate
      );

      ApiResponse.success(res, metrics, 200, { range });
    } catch (error) {
      next(error);
    }
  };
}

export const analyticsController = new AnalyticsController();

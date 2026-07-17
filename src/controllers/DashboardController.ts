import { Request, Response, NextFunction } from 'express';
import { dashboardAnalyticsService } from '../services/DashboardAnalyticsService';
import { ApiResponse } from '../utils/response';

export class DashboardController {
  private getQueryParams(req: Request) {
    const range = (req.query.range as string) || '30d';
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    return { range, startDate, endDate };
  }

  public getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { range, startDate, endDate } = this.getQueryParams(req);

      const overview = await dashboardAnalyticsService.getSummary(
        tenantId,
        range,
        startDate,
        endDate
      );

      ApiResponse.success(res, overview, 200, { range });
    } catch (error) {
      next(error);
    }
  };

  public getRevenue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { range, startDate, endDate } = this.getQueryParams(req);

      const revenue = await dashboardAnalyticsService.getRevenue(
        tenantId,
        range,
        startDate,
        endDate
      );

      ApiResponse.success(res, revenue, 200, { range });
    } catch (error) {
      next(error);
    }
  };

  public getEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { range, startDate, endDate } = this.getQueryParams(req);

      const events = await dashboardAnalyticsService.getEvents(
        tenantId,
        range,
        startDate,
        endDate
      );

      ApiResponse.success(res, events, 200, { range });
    } catch (error) {
      next(error);
    }
  };

  public getBookings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { range, startDate, endDate } = this.getQueryParams(req);

      const bookings = await dashboardAnalyticsService.getBookings(
        tenantId,
        range,
        startDate,
        endDate
      );

      ApiResponse.success(res, bookings, 200, { range });
    } catch (error) {
      next(error);
    }
  };

  public getPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { range, startDate, endDate } = this.getQueryParams(req);

      const payments = await dashboardAnalyticsService.getPayments(
        tenantId,
        range,
        startDate,
        endDate
      );

      ApiResponse.success(res, payments, 200, { range });
    } catch (error) {
      next(error);
    }
  };

  public getWorkspaces = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { range, startDate, endDate } = this.getQueryParams(req);

      const workspaces = await dashboardAnalyticsService.getWorkspaces(
        tenantId,
        range,
        startDate,
        endDate
      );

      ApiResponse.success(res, workspaces, 200, { range });
    } catch (error) {
      next(error);
    }
  };

  public getRegistrations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { range, startDate, endDate } = this.getQueryParams(req);

      const registrations = await dashboardAnalyticsService.getRegistrations(
        tenantId,
        range,
        startDate,
        endDate
      );

      ApiResponse.success(res, registrations, 200, { range });
    } catch (error) {
      next(error);
    }
  };

  public getCharts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId || 'weventurehub';
      const { range, startDate, endDate } = this.getQueryParams(req);

      const charts = await dashboardAnalyticsService.getCharts(
        tenantId,
        range,
        startDate,
        endDate
      );

      ApiResponse.success(res, charts, 200, { range });
    } catch (error) {
      next(error);
    }
  };
}

export const dashboardController = new DashboardController();

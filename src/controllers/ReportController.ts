import { Request, Response, NextFunction } from 'express';
import { Report, ReportHistory, ReportType, ReportFormat, ScheduleFrequency } from '../models/Report';
import { reportService } from '../services/ReportService';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';
import { AppError, NotFoundError } from '../errors/AppError';

export class ReportController {
  /**
   * GET /api/v1/reports
   * List all saved report templates for the active tenant
   */
  public getSavedReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId!;
      const reports = await Report.find({ tenantId: tenantId.toLowerCase() }).sort({ createdAt: -1 });
      ApiResponse.success(res, reports, 200, { message: 'Fetched saved report configurations successfully' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/reports
   * Save a new report template (and configure its BI scheduler if requested)
   */
  public createReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId!;
      const { name, type, description, filters, format, scheduling } = req.body;

      if (!name || !type) {
        throw new AppError('Name and report type are required fields', 400, 'BAD_REQUEST');
      }

      // Compute next run date if scheduling is enabled
      let nextRunAt: Date | undefined;
      if (scheduling && scheduling.enabled) {
        const freq = scheduling.frequency || ScheduleFrequency.DAILY;
        const now = new Date();
        if (freq === ScheduleFrequency.DAILY) {
          now.setDate(now.getDate() + 1);
        } else if (freq === ScheduleFrequency.WEEKLY) {
          now.setDate(now.getDate() + 7);
        } else if (freq === ScheduleFrequency.MONTHLY) {
          now.setMonth(now.getMonth() + 1);
        }
        nextRunAt = now;
      }

      const report = await Report.create({
        tenantId: tenantId.toLowerCase(),
        name,
        type,
        description,
        createdBy: req.body.createdBy || 'operator@weventurehub.com',
        filters: filters || {},
        format: format || ReportFormat.CSV,
        scheduling: {
          enabled: scheduling?.enabled || false,
          frequency: scheduling?.frequency,
          emailRecipients: scheduling?.emailRecipients || [],
          nextRunAt,
        },
      });

      logger.info(`💾 Created new report template [${report.id}] named "${report.name}" for tenant ${tenantId}`);
      ApiResponse.success(res, report, 201, { message: 'Report template configured and registered in BI scheduler' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/reports/:id
   * Delete a saved report configuration
   */
  public deleteReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const report = await Report.findOneAndDelete({ _id: id, tenantId: tenantId.toLowerCase() });
      if (!report) {
        throw new NotFoundError('Report template not found or unauthorized access');
      }

      logger.info(`🗑️ Deleted report template [${id}] for tenant ${tenantId}`);
      ApiResponse.success(res, null, 200, { message: 'Report template deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/reports/history
   * Retrieve generated report records/downloads
   */
  public getReportHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId!;
      const history = await ReportHistory.find({ tenantId: tenantId.toLowerCase() }).sort({ createdAt: -1 });
      ApiResponse.success(res, history, 200, { message: 'Report download records fetched successfully' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/reports/generate
   * Generates a report preview on-demand using custom query filters
   */
  public generateReportData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId!;
      const { type, filters } = req.body;

      if (!type) {
        throw new AppError('Report type is required to compile BI indicators', 400, 'BAD_REQUEST');
      }

      const result = await reportService.generateReportData(tenantId, type as ReportType, filters || {});
      ApiResponse.success(res, result, 200, { type, filters });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/reports/:id/run
   * Executes a saved report immediately, logs it into ReportHistory, and dispatches email alerts
   */
  public runSavedReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;

      const report = await Report.findOne({ _id: id, tenantId: tenantId.toLowerCase() });
      if (!report) {
        throw new NotFoundError('Report template not found or unauthorized access');
      }

      logger.info(`🏃 Running instant execution for saved report template [${report.id}]`);
      await reportService.runScheduledReport(report);

      ApiResponse.success(res, report, 200, { message: 'Report run executed successfully and archived in history log' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/reports/export
   * Format and export columns/rows into a base64 downloadable dataURI link
   */
  public exportReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { title, columns, rows, format } = req.body;

      if (!columns || !rows || !format) {
        throw new AppError('Columns, rows, and export format are required parameters', 400, 'BAD_REQUEST');
      }

      const reportTitle = title || 'WeVentureHub Business Report';
      let content = '';
      let mimeType = 'text/csv';

      if (format === ReportFormat.PDF) {
        const result = await reportService.generateReportData(req.tenantId!, req.body.type || ReportType.FINANCIAL, req.body.filters || {});
        content = reportService.exportToPdf(reportTitle, columns, rows, result.summary);
        mimeType = 'text/html';
      } else if (format === ReportFormat.EXCEL) {
        content = reportService.exportToExcel(columns, rows);
        mimeType = 'text/tab-separated-values';
      } else {
        content = reportService.exportToCsv(columns, rows);
        mimeType = 'text/csv';
      }

      const base64Content = Buffer.from(content).toString('base64');
      const fileUrl = `data:${mimeType};base64,${base64Content}`;

      ApiResponse.success(res, { fileUrl, format, filename: `${reportTitle.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}` }, 200);
    } catch (error) {
      next(error);
    }
  };
}

export const reportController = new ReportController();

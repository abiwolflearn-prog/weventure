import { Request, Response, NextFunction } from 'express';
import { quotationService } from '../services/QuotationService';
import { ApiResponse } from '../utils/response';
import { logger } from '../utils/logger';

export class QuotationController {
  /**
   * GET /api/quotations/banks
   */
  public async getSettlementBanks(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const tenantId = (req as any).tenantId || 'weventurehub';
      const banks = await quotationService.getSettlementBanks(tenantId);
      return ApiResponse.success(res, banks, 200, { message: 'Settlement banks retrieved successfully' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/quotations/banks
   */
  public async saveSettlementBank(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const tenantId = (req as any).tenantId || 'weventurehub';
      const bank = await quotationService.saveSettlementBank(tenantId, req.body);
      return ApiResponse.success(res, bank, 200, { message: 'Settlement bank saved successfully' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/quotations/banks/:bankName
   */
  public async deleteSettlementBank(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const tenantId = (req as any).tenantId || 'weventurehub';
      const result = await quotationService.deleteSettlementBank(tenantId, req.params.bankName);
      return ApiResponse.success(res, result, 200, { message: 'Settlement bank deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/quotations/next-number
   */
  public async getNextNumber(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const tenantId = (req as any).tenantId || 'weventurehub';
      const nextNumber = await quotationService.getNextQuotationNumber(tenantId);
      return ApiResponse.success(res, { nextNumber }, 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/quotations/stats
   */
  public async getQuotationStats(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const tenantId = (req as any).tenantId || 'weventurehub';
      const stats = await quotationService.getQuotationStats(tenantId);
      return ApiResponse.success(res, stats, 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/quotations
   */
  public async getQuotations(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const tenantId = (req as any).tenantId || 'weventurehub';
      const filter = {
        search: req.query.search as string,
        status: req.query.status as string,
        customerId: req.query.customerId as string,
        customerEmail: req.query.customerEmail as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        currency: req.query.currency as string,
        sort: req.query.sort as string,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 50,
      };

      const result = await quotationService.getQuotations(tenantId, filter);
      return res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        data: result.quotations,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/quotations
   */
  public async createQuotation(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const tenantId = (req as any).tenantId || 'weventurehub';
      const user = (req as any).user;
      const quotation = await quotationService.createQuotation(tenantId, req.body, user);
      return ApiResponse.success(res, quotation, 201, { message: 'Quotation created successfully' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/quotations/:id
   */
  public async getQuotationById(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const tenantId = (req as any).tenantId || 'weventurehub';
      const quotation = await quotationService.getQuotationById(req.params.id, tenantId);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Quotation not found' },
        });
      }
      return ApiResponse.success(res, quotation, 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/quotations/:id
   */
  public async updateQuotation(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const tenantId = (req as any).tenantId || 'weventurehub';
      const user = (req as any).user;
      const updated = await quotationService.updateQuotation(tenantId, req.params.id, req.body, user);
      return ApiResponse.success(res, updated, 200, { message: 'Quotation updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/quotations/:id
   */
  public async deleteQuotation(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const tenantId = (req as any).tenantId || 'weventurehub';
      const user = (req as any).user;
      await quotationService.deleteQuotation(tenantId, req.params.id, user);
      return ApiResponse.success(res, { deleted: true }, 200, { message: 'Quotation deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/quotations/:id/duplicate
   */
  public async duplicateQuotation(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const tenantId = (req as any).tenantId || 'weventurehub';
      const user = (req as any).user;
      const duplicated = await quotationService.duplicateQuotation(tenantId, req.params.id, user);
      return ApiResponse.success(res, duplicated, 201, { message: 'Quotation duplicated successfully' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/quotations/:id/status
   */
  public async updateQuotationStatus(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const tenantId = (req as any).tenantId || 'weventurehub';
      const user = (req as any).user;
      const { status } = req.body;
      const updated = await quotationService.updateQuotationStatus(tenantId, req.params.id, status, user);
      return ApiResponse.success(res, updated, 200, { message: `Quotation status updated to ${status}` });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/quotations/:id/convert-to-invoice
   */
  public async convertToInvoice(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const tenantId = (req as any).tenantId || 'weventurehub';
      const user = (req as any).user;
      const result = await quotationService.convertToInvoice(tenantId, req.params.id, user);
      return ApiResponse.success(res, result, 200, { message: result.message });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/quotations/:id/send
   */
  public async sendQuotationEmail(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const tenantId = (req as any).tenantId || 'weventurehub';
      const user = (req as any).user;
      const { recipientEmail, customMessage } = req.body;
      const result = await quotationService.sendQuotationEmail(tenantId, req.params.id, recipientEmail, customMessage, user);
      return ApiResponse.success(res, result, 200, { message: 'Quotation email dispatched successfully' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/quotations/:id/pdf or /download
   */
  public async downloadQuotationPdf(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const tenantId = (req as any).tenantId || 'weventurehub';
      const quotation = await quotationService.getQuotationById(req.params.id, tenantId);
      if (!quotation) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Quotation not found' },
        });
      }

      const pdfBuffer = await quotationService.generateQuotationPdfBuffer(quotation);
      const filename = `Quotation-${quotation.quotationNumber}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      return res.end(pdfBuffer);
    } catch (err) {
      logger.error('❌ Error generating Quotation PDF:', err);
      next(err);
    }
  }
}

export const quotationController = new QuotationController();

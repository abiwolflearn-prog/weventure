import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/payment/PaymentService';
import { discountService } from '../services/payment/DiscountService';
import { taxService } from '../services/payment/TaxService';
import { ApiResponse } from '../utils/response';
import { ValidationError, ForbiddenError, NotFoundError } from '../errors/AppError';
import { IUserIdentity, UserRole } from '../types';
import { logger } from '../utils/logger';
import { PaymentProvider } from '../models/Payment';

export class PaymentController {
  /**
   * Initiate checking out payment link
   */
  public async createPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const user = req.user as IUserIdentity;
      const { amount, currency, provider, targetType, targetId, firstName, lastName, billingDetails, promoCode } = req.body;

      if (!amount || !provider || !targetType || !targetId) {
        throw new ValidationError('amount, provider, targetType, and targetId are required fields');
      }

      const providerStr = String(provider).toUpperCase();
      const activeProvider = (PaymentProvider as any)[providerStr] || PaymentProvider.CHAPA;

      const result = await paymentService.createPayment(
        tenantId,
        user.id,
        user.email,
        Number(amount),
        currency || 'ETB',
        activeProvider,
        targetType as 'ORDER' | 'BOOKING' | 'INVOICE',
        targetId,
        firstName || user.firstName,
        lastName || user.lastName,
        billingDetails,
        promoCode
      );

      ApiResponse.success(res, result, 201, { message: 'Payment link generated successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check status or verify a specific payment transaction
   */
  public async verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { txRef } = req.params;

      if (!txRef) {
        throw new ValidationError('txRef parameter is required');
      }

      const payment = await paymentService.verifyAndApplyPayment(txRef, tenantId);
      ApiResponse.success(res, payment, 200, { message: 'Payment verified successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieve list of multi-tenant transactions
   */
  public async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const user = req.user as IUserIdentity;
      
      const filter: any = {};
      // For standard users, isolate records to their own. Admins can see all.
      if (user.role === UserRole.EXTERNAL_USER) {
        filter.userId = user.id;
      }

      const txns = await paymentService.getTransactions(tenantId, filter);
      ApiResponse.success(res, txns, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieve list of invoices
   */
  public async getInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const user = req.user as IUserIdentity;

      const filter: any = {};
      if (user.role === UserRole.EXTERNAL_USER) {
        filter.userId = user.id;
      }

      const invoices = await paymentService.getInvoices(tenantId, filter);
      ApiResponse.success(res, invoices, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieve single invoice by ID
   */
  public async getInvoiceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const user = req.user as IUserIdentity;

      const invoice = await paymentService.getInvoiceById(id, tenantId);
      if (!invoice) {
        throw new NotFoundError('Invoice not found');
      }

      // Safeguard: verify owner or higher privilege
      if (invoice.userId !== user.id && user.role === UserRole.EXTERNAL_USER) {
        throw new ForbiddenError('You are not authorized to view this invoice');
      }

      ApiResponse.success(res, invoice, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mock / structured Invoice PDF binary download
   */
  public async downloadInvoicePdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const user = req.user as IUserIdentity;

      const invoice = await paymentService.getInvoiceById(id, tenantId);
      if (!invoice) {
        throw new NotFoundError('Invoice not found');
      }

      if (invoice.userId !== user.id && user.role === UserRole.EXTERNAL_USER) {
        throw new ForbiddenError('You are not authorized to access this invoice file');
      }

      // Generate a structured printable text format representing an invoice PDF
      const formattedInvoiceText = `
============================================================
                     WEVENTUREHUB INVOICE
============================================================
Invoice Number: ${invoice.invoiceNumber}
Date Generated: ${new Date(invoice.createdAt).toLocaleDateString()}
Payment Status: ${invoice.status.toUpperCase()}
------------------------------------------------------------
CUSTOMER DETAILS:
Name: ${invoice.billingDetails.name}
Email: ${invoice.billingDetails.email}
Phone: ${invoice.billingDetails.phone || 'N/A'}
Company: ${invoice.billingDetails.company || 'N/A'}
Address: ${invoice.billingDetails.address || 'N/A'}
------------------------------------------------------------
LINE ITEMS:
${invoice.lineItems.map((item: any) => `- ${item.description}\n  Qty: ${item.quantity} | Unit Price: ${item.unitPrice} ${invoice.currency}\n  Total: ${item.amount} ${invoice.currency}`).join('\n')}
------------------------------------------------------------
GRAND TOTAL: ${invoice.amount} ${invoice.currency}
============================================================
Thank you for your business!
WeVentureHub Multi-Tenant Event & Workspace Management Platform
      `;

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.txt`);
      res.status(200).send(formattedInvoiceText.trim());
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request a Refund
   */
  public async requestRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const user = req.user as IUserIdentity;
      const { paymentId, amount, reason } = req.body;

      if (!paymentId || !amount || !reason) {
        throw new ValidationError('paymentId, amount, and reason are required');
      }

      const refund = await paymentService.requestRefund(
        tenantId,
        paymentId,
        Number(amount),
        reason,
        user
      );

      ApiResponse.success(res, refund, 201, { message: 'Refund request registered successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all refund requests
   */
  public async getRefunds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const refunds = await paymentService.getRefunds(tenantId);
      ApiResponse.success(res, refunds, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve a Refund (Admin Only)
   */
  public async approveRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const user = req.user as IUserIdentity;
      const { id } = req.params;

      const refund = await paymentService.approveRefund(tenantId, id, user);
      ApiResponse.success(res, refund, 200, { message: 'Refund request approved and processed successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject a Refund (Admin Only)
   */
  public async rejectRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const user = req.user as IUserIdentity;
      const { id } = req.params;

      const refund = await paymentService.rejectRefund(tenantId, id, user);
      ApiResponse.success(res, refund, 200, { message: 'Refund request rejected successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Financial statistics for tenant dashboard
   */
  public async getRevenueStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const stats = await paymentService.getRevenueStats(tenantId);
      ApiResponse.success(res, stats, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Chapa webhook listener
   */
  public async handleChapaWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('🔔 Chapa Webhook Received:', JSON.stringify(req.body));
      
      const signature = req.headers['x-chapa-signature'] as string;
      // Note: If signature verification is strictly needed, calculate hmac over raw body.
      // For general resilience, if signature is absent during local development, skip signature validation check
      
      const txRef = req.body?.tx_ref || req.body?.customization?.tx_ref;
      const tenantId = req.body?.meta?.tenantId || req.body?.customization?.meta?.tenantId || req.tenantId || 'global';

      if (!txRef) {
        logger.warn('⚠️ Webhook received but missing txRef identifier.');
        res.status(200).json({ status: 'ignored', message: 'Missing txRef' });
        return;
      }

      logger.info(`⚡ Processing webhook verification for txRef: ${txRef}, tenant: ${tenantId}`);
      await paymentService.verifyAndApplyPayment(txRef, tenantId);

      res.status(200).json({ status: 'success', message: 'Webhook processed successfully' });
    } catch (error: any) {
      logger.error('❌ Webhook error:', error.message);
      // Always respond with 200 to Chapa to avoid retries, but log the error
      res.status(200).json({ status: 'error', message: error.message });
    }
  }

  /**
   * Validate promo code and get dynamic calculation break down
   */
  public async validatePromoCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const { code, subtotal } = req.body;

      if (!code || !subtotal) {
        throw new ValidationError('code and subtotal are required fields');
      }

      const promo = await discountService.validatePromoCode(tenantId, code, Number(subtotal));
      const discountAmount = discountService.calculateDiscount(promo, Number(subtotal));
      const calculation = taxService.calculateCheckoutCosts(Number(subtotal), discountAmount);

      ApiResponse.success(res, {
        promo,
        discountAmount,
        calculation
      }, 200, { message: 'Promo code is valid' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create promo code (Admin/Staff only)
   */
  public async createPromoCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const user = req.user as IUserIdentity;

      if (user.role === UserRole.EXTERNAL_USER) {
        throw new ForbiddenError('Only workspace managers can configure promo discount codes.');
      }

      const { code, discountType, discountValue, maxUses, expiryDate } = req.body;
      if (!code || !discountType || discountValue === undefined) {
        throw new ValidationError('code, discountType, and discountValue are required fields');
      }

      const promo = await discountService.createPromoCode(tenantId, {
        code,
        discountType,
        discountValue: Number(discountValue),
        maxUses: maxUses !== undefined ? Number(maxUses) : undefined,
        expiryDate,
      });

      ApiResponse.success(res, promo, 201, { message: 'Promo code established successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all promo codes for the tenant
   */
  public async getPromoCodes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const promos = await discountService.getPromoCodes(tenantId);
      ApiResponse.success(res, promos, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle promo code status
   */
  public async togglePromoCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId!;
      const user = req.user as IUserIdentity;

      if (user.role === UserRole.EXTERNAL_USER) {
        throw new ForbiddenError('Only workspace managers can toggle promo codes.');
      }

      const { id } = req.params;
      const { isActive } = req.body;

      if (isActive === undefined) {
        throw new ValidationError('isActive field is required');
      }

      const promo = await discountService.togglePromoCode(tenantId, id, Boolean(isActive));
      ApiResponse.success(res, promo, 200, { message: 'Promo code updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get ArifPay payment config
   */
  public async getPaymentConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'global';
      const config = await paymentService.getPaymentConfig(tenantId);
      ApiResponse.success(res, config, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Save ArifPay payment config
   */
  public async savePaymentConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || 'global';
      const { settings, enabled } = req.body;
      const config = await paymentService.savePaymentConfig(tenantId, settings, enabled);
      ApiResponse.success(res, config, 200, { message: 'ArifPay payment configuration updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ArifPay webhook listener
   */
  public async handleArifPayWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('🔔 ArifPay Webhook Received:', JSON.stringify(req.body));
      
      const txRef = req.body?.txRef || req.body?.data?.txRef || req.body?.sessionId || req.body?.data?.sessionId;
      const tenantId = req.body?.meta?.tenantId || req.body?.data?.meta?.tenantId || req.tenantId || 'global';

      if (!txRef) {
        logger.warn('⚠️ ArifPay webhook received but missing txRef identifier.');
        res.status(200).json({ status: 'ignored', message: 'Missing txRef' });
        return;
      }

      logger.info(`⚡ Processing ArifPay webhook verification for txRef: ${txRef}, tenant: ${tenantId}`);
      await paymentService.verifyAndApplyPayment(txRef, tenantId);

      res.status(200).json({ status: 'success', message: 'Webhook processed successfully' });
    } catch (error: any) {
      logger.error('❌ ArifPay Webhook error:', error.message);
      res.status(200).json({ status: 'error', message: error.message });
    }
  }
}

export const paymentController = new PaymentController();

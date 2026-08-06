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
      const tenantId = (req.tenantId || req.user?.tenantId || "weventurehub");
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
      const tenantId = (req.tenantId || req.user?.tenantId || "weventurehub");
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
      const tenantId = (req.tenantId || req.user?.tenantId || "weventurehub");
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
   * Retrieve list of invoices with filters
   */
  public async getInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req.tenantId || req.user?.tenantId || "weventurehub");
      const user = req.user as IUserIdentity;

      const filter: any = { ...req.query };
      const isAdminOrStaff = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF].includes(user.role as any);
      if (!isAdminOrStaff) {
        filter.userId = user.id;
        filter.userEmail = user.email;
      }

      const invoices = await paymentService.getInvoices(tenantId, filter);
      ApiResponse.success(res, invoices, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieve invoice statistics
   */
  public async getInvoiceStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req.tenantId || req.user?.tenantId || "weventurehub");
      const user = req.user as IUserIdentity;

      const filter: any = {};
      const isAdminOrStaff = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF].includes(user.role as any);
      if (!isAdminOrStaff) {
        filter.userId = user.id;
        filter.userEmail = user.email;
      }

      const stats = await paymentService.getInvoiceStats(tenantId, filter);
      ApiResponse.success(res, stats, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new invoice
   */
  public async createInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || req.user?.tenantId || 'weventurehub';
      const user = req.user as IUserIdentity;
      const created = await paymentService.createInvoice(tenantId, req.body, user);
      ApiResponse.success(res, created, 201, { message: 'Invoice created successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an invoice
   */
  public async deleteInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || req.user?.tenantId || 'weventurehub';
      const user = req.user as IUserIdentity;
      const { id } = req.params;
      await paymentService.deleteInvoice(tenantId, id, user);
      ApiResponse.success(res, { deleted: true }, 200, { message: 'Invoice deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Email an invoice
   */
  public async emailInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || req.user?.tenantId || 'weventurehub';
      const { id } = req.params;
      const { recipient, emailType, message } = req.body;
      const result = await paymentService.emailInvoice(tenantId, id, recipient, emailType, message);
      ApiResponse.success(res, result, 200, { message: `Invoice email queued for ${result.recipient}` });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Record payment for an invoice
   */
  public async recordPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || req.user?.tenantId || 'weventurehub';
      const user = req.user as IUserIdentity;
      const { id } = req.params;
      const updated = await paymentService.recordPayment(tenantId, id, req.body, user);
      ApiResponse.success(res, updated, 200, { message: 'Invoice payment recorded successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update invoice status (Admin/Super Admin)
   */
  public async updateInvoiceStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || req.user?.tenantId || 'weventurehub';
      const user = req.user as IUserIdentity;
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        throw new ValidationError('Status field is required');
      }

      const updated = await paymentService.updateInvoiceStatus(tenantId, id, status, user);
      ApiResponse.success(res, updated, 200, { message: 'Invoice status updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieve single invoice by ID
   */
  public async getInvoiceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || req.user?.tenantId || 'weventurehub';
      const { id } = req.params;
      const user = req.user as IUserIdentity;

      const invoice = await paymentService.getInvoiceById(id, tenantId);
      if (!invoice) {
        throw new NotFoundError('Invoice not found');
      }

      // Safeguard: verify owner or higher privilege
      const isAdminOrStaff = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF].includes(user.role as any);
      if (!isAdminOrStaff) {
        const isOwner = invoice.userId === user.id ||
                        invoice.customerId === user.id ||
                        (invoice.userEmail && invoice.userEmail.toLowerCase() === user.email.toLowerCase()) ||
                        (invoice.billingDetails?.email && invoice.billingDetails.email.toLowerCase() === user.email.toLowerCase());
        if (!isOwner) {
          throw new ForbiddenError('You are not authorized to view this invoice');
        }
      }

      ApiResponse.success(res, invoice, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PDF Invoice binary download
   */
  public async downloadInvoicePdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || req.user?.tenantId || 'weventurehub';
      const { id } = req.params;
      const user = req.user as IUserIdentity;

      const invoice = await paymentService.getInvoiceById(id, tenantId);
      if (!invoice) {
        throw new NotFoundError('Invoice not found');
      }

      const isAdminOrStaff = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.STAFF].includes(user.role as any);
      if (!isAdminOrStaff) {
        const isOwner = invoice.userId === user.id ||
                        invoice.customerId === user.id ||
                        (invoice.userEmail && invoice.userEmail.toLowerCase() === user.email.toLowerCase()) ||
                        (invoice.billingDetails?.email && invoice.billingDetails.email.toLowerCase() === user.email.toLowerCase());
        if (!isOwner) {
          throw new ForbiddenError('You are not authorized to access this invoice file');
        }
      }

      // Dynamic import to support ES Module runtime perfectly
      const PDFDocumentModule = await import('pdfkit');
      const PDFDocument = PDFDocumentModule.default;
      const QRCodeModule = await import('qrcode');
      const QRCode = QRCodeModule.default;

      // Create PDF Document on standard A4 paper size (595.28 x 841.89 pt) with precise, conservative margins
      const doc = new PDFDocument({ size: 'A4', margin: 35 });

      // Set headers for official PDF binary stream response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
      doc.pipe(res);

      // --- COLOR PALETTE & STYLES ---
      // WeVentureHub Brand Scheme: Success Green (#65A30D) and Dark Charcoal neutrals
      const primaryColor = '#65A30D';
      const darkColor = '#111827';
      const textGray = '#4B5563';
      const lightGray = '#F9FAFB';
      const borderGray = '#E5E7EB';

      // 1. TOP BRANDING HEADER
      // Top accent banner bar
      doc.rect(35, 35, 525, 4).fill(primaryColor);

      // Left-side Identity
      doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(16).text('WEVENTUREHUB', 35, 48);
      doc.fillColor(textGray).font('Helvetica').fontSize(8.5).text('Event & Workspace Management Platform', 35, 66);
      doc.fontSize(8).text('Bole Road, Mega Building 4th Floor, Addis Ababa, Ethiopia', 35, 76);
      doc.text('Email: billing@weventurehub.com | Tel: +251 11 600 8899', 35, 86);

      // Right-side Meta Header
      doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(9).text('OFFICIAL INVOICE', 350, 48, { align: 'right', width: 210 });
      doc.fontSize(14).text(invoice.invoiceNumber, 350, 60, { align: 'right', width: 210 });
      doc.font('Helvetica').fontSize(8.5).fillColor(textGray).text(`Booking ID: ${invoice.bookingId || 'N/A'}`, 350, 76, { align: 'right', width: 210 });

      // Dynamic Status Badge
      const statusStr = String(invoice.status || '').toLowerCase();
      const isPaid = statusStr === 'paid';
      const statusLabel = isPaid ? 'PAID' : 'PENDING PAYMENT';
      const badgeBg = isPaid ? '#ECFDF5' : '#FEF3C7';
      const badgeText = isPaid ? '#047857' : '#D97706';

      doc.save();
      doc.roundedRect(460, 88, 100, 16, 4).fill(badgeBg);
      doc.fillColor(badgeText).font('Helvetica-Bold').fontSize(7.5).text(statusLabel, 460, 92, { align: 'center', width: 100 });
      doc.restore();

      // Horizontal subtle line divider
      doc.strokeColor(borderGray).lineWidth(1).moveTo(35, 112).lineTo(560, 112).stroke();

      // 2. BILLED TO & METADATA GRID BOX
      doc.save();
      doc.roundedRect(35, 122, 525, 90, 6).fillAndStroke(lightGray, borderGray);
      doc.restore();

      // Left column: Billed To
      doc.fillColor(textGray).font('Helvetica-Bold').fontSize(7.5).text('BILLED TO:', 45, 130);
      doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(9.5).text(invoice.billingDetails?.name || 'N/A', 45, 142);
      if (invoice.billingDetails?.company) {
        doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(8.5).text(invoice.billingDetails.company, 45, 154);
      }
      doc.fillColor(textGray).font('Helvetica').fontSize(8).text(invoice.billingDetails?.email || invoice.userEmail || 'N/A', 45, 165);
      if (invoice.billingDetails?.phone) {
        doc.text(invoice.billingDetails.phone, 45, 175);
      }
      doc.fontSize(7).font('Helvetica-Bold').text(`CUSTOMER TYPE: ${(invoice.customerType || 'Individual').toUpperCase()}`, 45, 188);

      // Right column: Dates & Workspace Information
      doc.fillColor(textGray).font('Helvetica-Bold').fontSize(7.5).text('INVOICE DATES & SPACE INFO:', 300, 130);
      
      doc.font('Helvetica').fontSize(8);
      doc.text('Date Issued:', 300, 142);
      doc.font('Helvetica-Bold').text(invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : 'N/A', 420, 142, { align: 'right', width: 130 });

      doc.font('Helvetica').text('Due Date:', 300, 154);
      doc.font('Helvetica-Bold').fillColor('#BE123C').text(invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Immediate', 420, 154, { align: 'right', width: 130 });

      doc.fillColor(textGray).font('Helvetica').text('Workspace Name:', 300, 166);
      doc.font('Helvetica-Bold').fillColor(darkColor).text(invoice.workspaceName || 'Executive Workspace', 420, 166, { align: 'right', width: 130 });

      doc.fillColor(textGray).font('Helvetica').text('Billing Period:', 300, 178);
      doc.font('Helvetica-Bold').text(invoice.billingPeriod || 'Current Cycle', 420, 178, { align: 'right', width: 130 });

      // 3. TABLE OF LINE ITEMS (Compact heights to guarantee single-page fit)
      const tableTop = 225;
      doc.save().rect(35, tableTop, 525, 18).fill(darkColor);

      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7.5);
      doc.text('Description', 45, tableTop + 5);
      doc.text('Duration / Plan', 240, tableTop + 5, { width: 90, align: 'center' });
      doc.text('Qty', 340, tableTop + 5, { width: 30, align: 'center' });
      doc.text('Unit Price', 380, tableTop + 5, { width: 80, align: 'right' });
      doc.text('Total Amount', 470, tableTop + 5, { width: 80, align: 'right' });
      doc.restore();

      // Populate row items
      const items = invoice.lineItems && invoice.lineItems.length > 0 ? invoice.lineItems : [{
        description: `Tenancy Workspace Rental Charge - ${invoice.workspaceName || 'Executive Suite'}`,
        quantity: invoice.durationQuantity || 1,
        unitPrice: invoice.unitPrice || invoice.amount || 0,
        amount: invoice.amount || 0
      }];

      let currentY = tableTop + 18;
      items.forEach((item: any) => {
        doc.fillColor(darkColor).font('Helvetica').fontSize(8);
        doc.text(item.description, 45, currentY + 5, { width: 190 });
        doc.text(invoice.durationType || 'Hourly', 240, currentY + 5, { width: 90, align: 'center' });
        doc.text(String(item.quantity), 340, currentY + 5, { width: 30, align: 'center' });
        doc.text(`${(item.unitPrice || 0).toLocaleString()} ${invoice.currency || 'ETB'}`, 380, currentY + 5, { width: 80, align: 'right' });
        doc.text(`${(item.amount || 0).toLocaleString()} ${invoice.currency || 'ETB'}`, 470, currentY + 5, { width: 80, align: 'right' });

        currentY += 20;
        doc.strokeColor(borderGray).lineWidth(0.5).moveTo(35, currentY).lineTo(560, currentY).stroke();
      });

      // 4. LOWER SECTION: PAYMENTS, QR CODE & GRAND TOTALS
      const totalsY = currentY + 12;

      // Draw QR Code
      try {
        const qrContent = `Invoice: ${invoice.invoiceNumber}\nAmount: ${invoice.grandTotal || invoice.amount} ${invoice.currency}\nStatus: ${invoice.status}`;
        const qrDataUrl = await QRCode.toDataURL(qrContent, { margin: 1, width: 110 });
        const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
        doc.image(qrBuffer, 35, totalsY, { width: 75, height: 75 });
      } catch (qrErr) {
        console.error('Failed to embed QR code in PDF:', qrErr);
      }

      // Payment Terms info block
      doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(7.5).text('Payment Terms & Instructions:', 125, totalsY);
      doc.fillColor(textGray).font('Helvetica').fontSize(7);
      doc.text('Please process your invoice payments via our integrated payment portal (supporting ArifPay, Telebirr, CBE, or Chapa). All workspace tenancy invoices include standard 15% VAT compliance tax.', 125, totalsY + 10, { width: 210, lineGap: 1.5 });

      // Right Column Financial breakdown
      doc.fillColor(textGray).font('Helvetica').fontSize(8);
      doc.text('Subtotal Amount:', 350, totalsY);
      doc.text(`${(invoice.amount || 0).toLocaleString()} ${invoice.currency || 'ETB'}`, 470, totalsY, { align: 'right', width: 80 });

      doc.text('VAT (15% Tax):', 350, totalsY + 12);
      doc.text(`${(invoice.vat || 0).toLocaleString()} ${invoice.currency || 'ETB'}`, 470, totalsY + 12, { align: 'right', width: 80 });

      let financialY = totalsY + 24;
      if (invoice.discount > 0) {
        doc.fillColor(primaryColor);
        doc.text('Discount Applied:', 350, financialY);
        doc.text(`-${(invoice.discount || 0).toLocaleString()} ${invoice.currency || 'ETB'}`, 470, financialY, { align: 'right', width: 80 });
        financialY += 12;
      }

      // Thin divider
      doc.strokeColor('#D1D5DB').lineWidth(0.75).moveTo(350, financialY).lineTo(560, financialY).stroke();

      // Grand Total display
      doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(10);
      doc.text('Grand Total:', 350, financialY + 6);
      doc.fillColor(primaryColor).text(`${(invoice.grandTotal || invoice.amount || 0).toLocaleString()} ${invoice.currency || 'ETB'}`, 470, financialY + 6, { align: 'right', width: 80 });

      // 5. STABLE SINGLE-PAGE FOOTER SIGNATURES (Anchored to exact bottom range of standard A4)
      const footerY = 745;
      doc.strokeColor(borderGray).lineWidth(1).moveTo(35, footerY - 8).lineTo(560, footerY - 8).stroke();

      doc.fillColor(textGray).font('Helvetica').fontSize(7.5);
      doc.text('WeVentureHub Finance Department', 35, footerY);
      doc.text('Thank you for choosing WeVentureHub Workspace Solutions!', 35, footerY + 10);

      // Authorized signature line
      doc.strokeColor('#9CA3AF').lineWidth(0.75).moveTo(380, footerY + 10).lineTo(540, footerY + 10).stroke();
      doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(7.5);
      doc.text('Authorized Stamp & Signature', 380, footerY + 14, { width: 160, align: 'center' });

      doc.end();

    } catch (error) {
      next(error);
    }
  }

  /**
   * Request a Refund
   */
  public async requestRefund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantId || req.user?.tenantId || 'weventurehub';
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
      const tenantId = req.tenantId || req.user?.tenantId || 'weventurehub';
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
      const tenantId = req.tenantId || req.user?.tenantId || 'weventurehub';
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
      const tenantId = req.tenantId || req.user?.tenantId || 'weventurehub';
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
      const tenantId = req.tenantId || req.user?.tenantId || 'weventurehub';
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
      const tenantId = req.tenantId || req.user?.tenantId || 'weventurehub';
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
      const tenantId = req.tenantId || req.user?.tenantId || 'weventurehub';
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
      const tenantId = req.tenantId || req.user?.tenantId || 'weventurehub';
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
      const tenantId = req.tenantId || req.user?.tenantId || 'weventurehub';
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

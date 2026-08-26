import { Quotation, QuotationStatus, IQuotationDocument, IQuotationItem } from '../models/Quotation';
import { Invoice, InvoiceStatus } from '../models/Invoice';
import { PaymentBank } from '../models/PaymentBank';
import { AuditLog } from '../models/AuditLog';
import { ValidationError, NotFoundError } from '../errors/AppError';
import { logger } from '../utils/logger';
import { IUserIdentity } from '../types';
import { numberToWords, WEVENTURE_SUPPLIER_INFO, WEVENTURE_BANKS, BankRecord } from '../utils/invoiceUtils';
import { EmailPayload } from './EmailService';

export class QuotationService {
  /**
   * Helper to write audit log entry
   */
  private async logActivity(
    tenantId: string,
    user: any,
    action: string,
    resourceId: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      await AuditLog.create({
        tenantId,
        userId: user?.id || 'system',
        userEmail: user?.email || 'admin@weventurehub.com',
        action,
        resourceType: 'QUOTATION',
        resourceId,
        details,
        timestamp: new Date(),
      });
    } catch (err) {
      logger.error('⚠️ Failed to record quotation audit log:', err);
    }
  }

  /**
   * Initialize and get active settlement banks from DB (falling back to default banks)
   */
  public async getSettlementBanks(tenantId: string = 'weventurehub'): Promise<BankRecord[]> {
    try {
      const dbBanks = await (PaymentBank as any).find({ tenantId, isActive: true }).exec();
      if (dbBanks && dbBanks.length > 0) {
        return dbBanks.map((b: any) => ({
          bankName: b.bankName,
          accountName: b.accountName,
          accountNumber: b.accountNumber,
          branch: b.branch,
        }));
      }

      // Seed initial default banks if empty
      const defaultDocs = WEVENTURE_BANKS.map((b, idx) => ({
        tenantId,
        bankName: b.bankName,
        accountName: b.accountName,
        accountNumber: b.accountNumber,
        branch: b.branch,
        isActive: true,
        isDefault: idx === 0,
      }));
      await (PaymentBank as any).insertMany(defaultDocs);
      return WEVENTURE_BANKS;
    } catch (err) {
      logger.warn('⚠️ Error fetching settlement banks, using defaults:', err);
      return WEVENTURE_BANKS;
    }
  }

  /**
   * Save / Add a new settlement bank
   */
  public async saveSettlementBank(tenantId: string, data: any): Promise<any> {
    if (!data.bankName || !data.accountNumber || !data.branch) {
      throw new ValidationError('bankName, accountNumber, and branch are required');
    }
    const bank = await (PaymentBank as any).findOneAndUpdate(
      { tenantId, bankName: data.bankName },
      {
        tenantId,
        bankName: data.bankName,
        accountName: data.accountName || 'WE VENTURE HOLDINGS PLC',
        accountNumber: data.accountNumber,
        branch: data.branch,
        swiftCode: data.swiftCode,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      { upsert: true, new: true }
    );
    return bank;
  }

  /**
   * Delete settlement bank
   */
  public async deleteSettlementBank(tenantId: string, bankIdOrName: string): Promise<any> {
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(bankIdOrName);
    if (isMongoId) {
      await (PaymentBank as any).deleteOne({ _id: bankIdOrName, tenantId }).exec();
    } else {
      await (PaymentBank as any).deleteOne({ bankName: bankIdOrName, tenantId }).exec();
    }
    return { success: true };
  }

  /**
   * Generate next dynamic Quotation Number (e.g. QUO-WV-1001)
   */
  public async getNextQuotationNumber(tenantId: string = 'weventurehub'): Promise<string> {
    const count = await (Quotation as any).countDocuments({ tenantId }).exec();
    const nextSeq = 1001 + count;

    // Verify uniqueness
    let candidate = `QUO-WV-${nextSeq}`;
    let exists = await (Quotation as any).findOne({ tenantId, quotationNumber: candidate }).exec();
    let offset = 1;
    while (exists) {
      candidate = `QUO-WV-${nextSeq + offset}`;
      exists = await (Quotation as any).findOne({ tenantId, quotationNumber: candidate }).exec();
      offset++;
    }
    return candidate;
  }

  /**
   * Compute verified financial totals server-side (No Subtotal/VAT breakdown)
   */
  public calculateTotals(
    items: IQuotationItem[],
    currency: 'USD' | 'ETB' = 'USD',
    exchangeRate: number = 153.09,
    discount: number = 0,
    vatRate: number = 0
  ): {
    sanitizedItems: IQuotationItem[];
    subtotal: number;
    vat: number;
    discount: number;
    grandTotal: number;
    convertedEtbTotal: number;
    amountInWords: string;
  } {
    const sanitizedItems: IQuotationItem[] = (items || []).map((item) => {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const rate = Math.max(0, Number(item.unitPrice) || 0);
      const amt = Math.round(qty * rate * 100) / 100;
      return {
        serviceId: item.serviceId,
        itemName: (item.itemName || 'Workspace Rental Service').trim(),
        description: item.description || '',
        quantity: qty,
        unitPrice: rate,
        amount: amt,
      };
    });

    const subtotal = Math.round(sanitizedItems.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
    const sanitizedDiscount = Math.min(subtotal, Math.max(0, Number(discount) || 0));
    const grandTotal = Math.max(0, Math.round((subtotal - sanitizedDiscount) * 100) / 100);

    const safeExchangeRate = Math.max(0.01, Number(exchangeRate) || 153.09);
    const convertedEtbTotal =
      currency === 'USD'
        ? Math.round(grandTotal * safeExchangeRate * 100) / 100
        : grandTotal;

    const amountInWords = numberToWords(grandTotal, currency);

    return {
      sanitizedItems,
      subtotal: grandTotal,
      vat: 0,
      discount: sanitizedDiscount,
      grandTotal,
      convertedEtbTotal,
      amountInWords,
    };
  }

  /**
   * Create a new Quotation
   */
  public async createQuotation(tenantId: string, data: any, user?: IUserIdentity): Promise<IQuotationDocument> {
    const tid = tenantId || 'weventurehub';

    if (!data.customerName || !data.email) {
      throw new ValidationError('Customer Name and Email are required');
    }

    const quotationNumber = data.quotationNumber || (await this.getNextQuotationNumber(tid));
    const currency: 'USD' | 'ETB' = data.currency === 'ETB' ? 'ETB' : 'USD';
    const exchangeRate = Number(data.exchangeRate) > 0 ? Number(data.exchangeRate) : 153.09;

    const rawItems = Array.isArray(data.items) && data.items.length > 0
      ? data.items
      : [
          {
            itemName: data.workspaceName || 'Executive Coworking Space Rental',
            description: data.notes || 'Full workspace allocation with access to hub amenities',
            quantity: Number(data.durationQuantity) || 1,
            unitPrice: Number(data.unitPrice) || (currency === 'USD' ? 500 : 50000),
          },
        ];

    const calc = this.calculateTotals(rawItems, currency, exchangeRate, data.discount);

    // Default amenities
    const defaultAmenities = [
      'High-Speed Dedicated Fiber Wi-Fi (Dual Redundancy)',
      'Uninterruptible Power Supply (UPS) & Backup Generator',
      'Electronic presentation display screens & TV screens',
      'High-fidelity sound system & wireless microphones',
      'Ergonomic workstation furniture and executive seating',
      'Complimentary printing, scanning, and copying services',
      'Full access to lounge, kitchenette & barista coffee stations',
      '24/7 Biometric access & round-the-clock facility security',
    ];

    const amenities = Array.isArray(data.amenities) && data.amenities.length > 0
      ? data.amenities
      : defaultAmenities;

    const quotationDate = data.quotationDate ? new Date(data.quotationDate) : new Date();
    const validUntil = data.validUntil
      ? new Date(data.validUntil)
      : new Date(quotationDate.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days default

    const selectedBanks = Array.isArray(data.selectedBanks) && data.selectedBanks.length > 0
      ? data.selectedBanks
      : ['Dashen Bank', 'Commercial Bank of Ethiopia'];

    const quotation = new Quotation({
      tenantId: tid,
      quotationNumber,
      customerId: data.customerId,
      userId: data.userId || user?.id,
      customerName: data.customerName.trim(),
      companyName: data.companyName?.trim() || '',
      tinNumber: data.tinNumber?.trim() || '',
      email: data.email.trim(),
      phone: data.phone?.trim() || '',
      address: data.address?.trim() || '',
      quotationDate,
      validUntil,
      preparedBy: data.preparedBy?.trim() || (user ? `${user.firstName} ${user.lastName}`.trim() : 'WeVentureHub Sales Team'),
      salespersonEmail: data.salespersonEmail || user?.email,
      currency,
      exchangeRate,
      items: calc.sanitizedItems,
      subtotal: calc.subtotal,
      vat: calc.vat,
      discount: calc.discount,
      grandTotal: calc.grandTotal,
      convertedEtbTotal: calc.convertedEtbTotal,
      amountInWords: calc.amountInWords,
      amenities,
      selectedBanks,
      bankDetails: data.bankDetails || '',
      notes:
        data.notes ||
        'Thank you for choosing WeVentureHub. This quotation is valid until the specified date. All rates are inclusive of 15% standard VAT.',
      paymentTerms:
        data.paymentTerms ||
        'Payment terms: 100% advance upon contract execution or official acceptance. Bank transfer details listed below.',
      status: data.status || QuotationStatus.DRAFT,
      history: [
        {
          action: 'CREATED',
          performedBy: user?.email || 'admin@weventurehub.com',
          timestamp: new Date(),
          note: `Quotation created with total of ${calc.grandTotal} ${currency}`,
        },
      ],
    });

    const saved = await quotation.save();
    if (user) {
      await this.logActivity(tid, user, 'CREATE_QUOTATION', saved.id, {
        quotationNumber: saved.quotationNumber,
        grandTotal: saved.grandTotal,
        customerName: saved.customerName,
      });
    }
    return saved;
  }

  /**
   * Get Quotations with search, filters, pagination, and sorting
   */
  public async getQuotations(tenantId: string, filter: any = {}): Promise<any> {
    const tid = tenantId || 'weventurehub';
    const query: Record<string, any> = { tenantId: tid };

    // Auto-expire quotations whose validUntil has passed and are still Draft or Sent
    const now = new Date();
    await (Quotation as any).updateMany(
      {
        tenantId: tid,
        validUntil: { $lt: now },
        status: { $in: [QuotationStatus.DRAFT, QuotationStatus.SENT, QuotationStatus.VIEWED] },
      },
      { status: QuotationStatus.EXPIRED }
    ).exec();

    // Search query
    if (filter.search) {
      const regex = new RegExp(filter.search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      query.$or = [
        { quotationNumber: regex },
        { customerName: regex },
        { companyName: regex },
        { email: regex },
        { tinNumber: regex },
        { phone: regex },
        { notes: regex },
        { 'items.itemName': regex },
      ];
    }

    // Status filter
    if (filter.status && filter.status !== 'All') {
      query.status = filter.status;
    }

    // Customer filter (id or email)
    if (filter.customerId) {
      query.customerId = filter.customerId;
    }
    if (filter.customerEmail) {
      query.email = new RegExp(`^${filter.customerEmail}$`, 'i');
    }

    // Date range filter
    if (filter.startDate || filter.endDate) {
      query.quotationDate = {};
      if (filter.startDate) query.quotationDate.$gte = new Date(filter.startDate);
      if (filter.endDate) {
        const endD = new Date(filter.endDate);
        endD.setHours(23, 59, 59, 999);
        query.quotationDate.$lte = endD;
      }
    }

    // Currency filter
    if (filter.currency && filter.currency !== 'All') {
      query.currency = filter.currency;
    }

    // Sorting
    let sortOption: any = { quotationDate: -1, createdAt: -1 };
    if (filter.sort === 'oldest') sortOption = { quotationDate: 1, createdAt: 1 };
    if (filter.sort === 'valid_until') sortOption = { validUntil: 1 };
    if (filter.sort === 'amount_desc') sortOption = { grandTotal: -1 };
    if (filter.sort === 'amount_asc') sortOption = { grandTotal: 1 };

    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const [quotations, total] = await Promise.all([
      (Quotation as any).find(query).sort(sortOption).skip(skip).limit(limit).exec(),
      (Quotation as any).countDocuments(query).exec(),
    ]);

    return {
      quotations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get single Quotation by ID or quotationNumber
   */
  public async getQuotationById(id: string, tenantId: string = 'weventurehub'): Promise<IQuotationDocument | null> {
    if (!id || typeof id !== 'string') return null;
    const cleanId = id.trim();
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(cleanId);

    if (isMongoId) {
      const q = await (Quotation as any).findOne({ _id: cleanId, tenantId }).exec();
      if (q) return q;
    }

    const byNumber = await (Quotation as any).findOne({
      quotationNumber: { $regex: new RegExp(`^${cleanId}$`, 'i') },
      tenantId,
    }).exec();
    if (byNumber) return byNumber;

    // Fallback without tenantId restriction
    if (isMongoId) {
      return await (Quotation as any).findById(cleanId).exec();
    }
    return await (Quotation as any).findOne({
      quotationNumber: { $regex: new RegExp(`^${cleanId}$`, 'i') },
    }).exec();
  }

  /**
   * Get Quotation Dashboard KPI Statistics
   */
  public async getQuotationStats(tenantId: string = 'weventurehub'): Promise<any> {
    const tid = tenantId || 'weventurehub';
    const quotations = await (Quotation as any).find({ tenantId: tid }).exec();

    let totalQuotations = quotations.length;
    let draft = 0;
    let sent = 0;
    let viewed = 0;
    let accepted = 0;
    let rejected = 0;
    let expired = 0;
    let converted = 0;

    let totalValueUsd = 0;
    let totalValueEtb = 0;
    let acceptedValueUsd = 0;
    let acceptedValueEtb = 0;

    for (const q of quotations) {
      const status = q.status;
      const isUsd = q.currency === 'USD';
      const usdVal = isUsd ? q.grandTotal : q.grandTotal / (q.exchangeRate || 153.09);
      const etbVal = isUsd ? q.convertedEtbTotal || q.grandTotal * (q.exchangeRate || 153.09) : q.grandTotal;

      totalValueUsd += usdVal;
      totalValueEtb += etbVal;

      if (status === QuotationStatus.DRAFT) draft++;
      else if (status === QuotationStatus.SENT) sent++;
      else if (status === QuotationStatus.VIEWED) viewed++;
      else if (status === QuotationStatus.ACCEPTED) {
        accepted++;
        acceptedValueUsd += usdVal;
        acceptedValueEtb += etbVal;
      } else if (status === QuotationStatus.REJECTED) rejected++;
      else if (status === QuotationStatus.EXPIRED) expired++;
      else if (status === QuotationStatus.CONVERTED) {
        converted++;
        acceptedValueUsd += usdVal;
        acceptedValueEtb += etbVal;
      }
    }

    return {
      totalQuotations,
      draft,
      sent,
      viewed,
      accepted,
      rejected,
      expired,
      converted,
      conversionRate: totalQuotations > 0 ? Math.round(((accepted + converted) / totalQuotations) * 100) : 0,
      totalValueUsd: Math.round(totalValueUsd * 100) / 100,
      totalValueEtb: Math.round(totalValueEtb * 100) / 100,
      acceptedValueUsd: Math.round(acceptedValueUsd * 100) / 100,
      acceptedValueEtb: Math.round(acceptedValueEtb * 100) / 100,
    };
  }

  /**
   * Update an existing Quotation
   */
  public async updateQuotation(
    tenantId: string,
    id: string,
    data: any,
    user?: IUserIdentity
  ): Promise<IQuotationDocument> {
    const tid = tenantId || 'weventurehub';
    const quotation = await this.getQuotationById(id, tid);
    if (!quotation) {
      throw new NotFoundError('Quotation not found');
    }

    if (data.customerName) quotation.customerName = data.customerName.trim();
    if (data.companyName !== undefined) quotation.companyName = data.companyName.trim();
    if (data.tinNumber !== undefined) quotation.tinNumber = data.tinNumber.trim();
    if (data.email) quotation.email = data.email.trim();
    if (data.phone !== undefined) quotation.phone = data.phone.trim();
    if (data.address !== undefined) quotation.address = data.address.trim();
    if (data.preparedBy) quotation.preparedBy = data.preparedBy.trim();
    if (data.salespersonEmail) quotation.salespersonEmail = data.salespersonEmail.trim();

    if (data.quotationDate) quotation.quotationDate = new Date(data.quotationDate);
    if (data.validUntil) quotation.validUntil = new Date(data.validUntil);

    if (data.currency) quotation.currency = data.currency;
    if (data.exchangeRate) quotation.exchangeRate = Number(data.exchangeRate);

    if (data.amenities && Array.isArray(data.amenities)) {
      quotation.amenities = data.amenities;
    }
    if (data.selectedBanks && Array.isArray(data.selectedBanks)) {
      quotation.selectedBanks = data.selectedBanks;
    }
    if (data.bankDetails !== undefined) quotation.bankDetails = data.bankDetails;
    if (data.notes !== undefined) quotation.notes = data.notes;
    if (data.paymentTerms !== undefined) quotation.paymentTerms = data.paymentTerms;

    if (data.status) {
      quotation.status = data.status;
    }

    // Recalculate totals
    const itemsToCalc = data.items || quotation.items;
    const calc = this.calculateTotals(
      itemsToCalc,
      quotation.currency,
      quotation.exchangeRate,
      data.discount !== undefined ? data.discount : quotation.discount
    );

    quotation.items = calc.sanitizedItems as any;
    quotation.subtotal = calc.subtotal;
    quotation.vat = calc.vat;
    quotation.discount = calc.discount;
    quotation.grandTotal = calc.grandTotal;
    quotation.convertedEtbTotal = calc.convertedEtbTotal;
    quotation.amountInWords = calc.amountInWords;

    quotation.history.push({
      action: 'UPDATED',
      performedBy: user?.email || 'admin@weventurehub.com',
      timestamp: new Date(),
      note: `Quotation updated. New total: ${quotation.grandTotal} ${quotation.currency}`,
    });

    const saved = await quotation.save();
    if (user) {
      await this.logActivity(tid, user, 'UPDATE_QUOTATION', saved.id, {
        quotationNumber: saved.quotationNumber,
        grandTotal: saved.grandTotal,
      });
    }
    return saved;
  }

  /**
   * Delete Quotation
   */
  public async deleteQuotation(tenantId: string, id: string, user?: IUserIdentity): Promise<any> {
    const tid = tenantId || 'weventurehub';
    const quotation = await this.getQuotationById(id, tid);
    if (!quotation) {
      throw new NotFoundError('Quotation not found');
    }

    await Quotation.deleteOne({ _id: quotation._id }).exec();
    if (user) {
      await this.logActivity(tid, user, 'DELETE_QUOTATION', quotation.id, {
        quotationNumber: quotation.quotationNumber,
      });
    }
    return { success: true };
  }

  /**
   * Duplicate a Quotation
   */
  public async duplicateQuotation(tenantId: string, id: string, user?: IUserIdentity): Promise<IQuotationDocument> {
    const tid = tenantId || 'weventurehub';
    const source = await this.getQuotationById(id, tid);
    if (!source) {
      throw new NotFoundError('Source quotation not found');
    }

    const nextNumber = await this.getNextQuotationNumber(tid);
    const duplicated = new Quotation({
      tenantId: tid,
      quotationNumber: nextNumber,
      customerId: source.customerId,
      userId: user?.id || source.userId,
      customerName: source.customerName,
      companyName: source.companyName,
      tinNumber: source.tinNumber,
      email: source.email,
      phone: source.phone,
      address: source.address,
      quotationDate: new Date(),
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      preparedBy: user ? `${user.firstName} ${user.lastName}`.trim() : source.preparedBy,
      salespersonEmail: user?.email || source.salespersonEmail,
      currency: source.currency,
      exchangeRate: source.exchangeRate,
      items: source.items,
      subtotal: source.subtotal,
      vat: source.vat,
      discount: source.discount,
      grandTotal: source.grandTotal,
      convertedEtbTotal: source.convertedEtbTotal,
      amountInWords: source.amountInWords,
      amenities: source.amenities,
      selectedBanks: source.selectedBanks,
      bankDetails: source.bankDetails,
      notes: source.notes,
      paymentTerms: source.paymentTerms,
      status: QuotationStatus.DRAFT,
      history: [
        {
          action: 'DUPLICATED',
          performedBy: user?.email || 'admin@weventurehub.com',
          timestamp: new Date(),
          note: `Duplicated from ${source.quotationNumber}`,
        },
      ],
    });

    const saved = await duplicated.save();
    if (user) {
      await this.logActivity(tid, user, 'DUPLICATE_QUOTATION', saved.id, {
        sourceNumber: source.quotationNumber,
        newNumber: saved.quotationNumber,
      });
    }
    return saved;
  }

  /**
   * Update Quotation Status
   */
  public async updateQuotationStatus(
    tenantId: string,
    id: string,
    status: string,
    user?: IUserIdentity
  ): Promise<IQuotationDocument> {
    const tid = tenantId || 'weventurehub';
    const quotation = await this.getQuotationById(id, tid);
    if (!quotation) {
      throw new NotFoundError('Quotation not found');
    }

    quotation.status = status;
    quotation.history.push({
      action: 'STATUS_CHANGED',
      performedBy: user?.email || 'admin@weventurehub.com',
      timestamp: new Date(),
      note: `Status changed to ${status}`,
    });

    const saved = await quotation.save();
    if (user) {
      await this.logActivity(tid, user, 'UPDATE_QUOTATION_STATUS', saved.id, {
        status,
        quotationNumber: saved.quotationNumber,
      });
    }
    return saved;
  }

  /**
   * Convert Accepted Quotation to Official Invoice
   */
  public async convertToInvoice(tenantId: string, id: string, user?: IUserIdentity): Promise<any> {
    const tid = tenantId || 'weventurehub';
    const quotation = await this.getQuotationById(id, tid);
    if (!quotation) {
      throw new NotFoundError('Quotation not found');
    }

    if (quotation.convertedInvoiceId) {
      const existingInv = await Invoice.findById(quotation.convertedInvoiceId).exec();
      if (existingInv) {
        return {
          quotation,
          invoice: existingInv,
          alreadyConverted: true,
          message: `Quotation already converted to invoice ${existingInv.invoiceNumber}`,
        };
      }
    }

    // Generate next invoice number
    const count = await Invoice.countDocuments({ tenantId: tid }).exec();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const invoiceNumber = `INV-${dateStr}-${(1001 + count).toString().slice(-4)}`;

    // Build line items from quotation items
    const lineItems = quotation.items.map((item) => ({
      description: item.description ? `${item.itemName} - ${item.description}` : item.itemName,
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || 0,
      amount: item.amount || 0,
    }));

    const invoice = new Invoice({
      tenantId: tid,
      userId: quotation.userId || quotation.customerId || 'weventure-customer',
      customerId: quotation.customerId,
      userEmail: quotation.email,
      invoiceNumber,
      amount: quotation.subtotal,
      vat: quotation.vat,
      discount: quotation.discount,
      grandTotal: quotation.grandTotal,
      currency: quotation.currency,
      status: InvoiceStatus.PENDING,
      paymentStatus: InvoiceStatus.PENDING,
      customerType: quotation.companyName ? 'Company' : 'Individual',
      billingDetails: {
        name: quotation.customerName,
        email: quotation.email,
        phone: quotation.phone || '',
        company: quotation.companyName || '',
        address: quotation.address || '',
        taxId: quotation.tinNumber || '',
        tinNumber: quotation.tinNumber || '',
      },
      customerTin: quotation.tinNumber || '',
      lineItems,
      workspaceName: quotation.items[0]?.itemName || 'WeVentureHub Workspace',
      durationType: 'Custom',
      durationQuantity: quotation.items[0]?.quantity || 1,
      unitPrice: quotation.items[0]?.unitPrice || quotation.grandTotal,
      dueDate: quotation.validUntil || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      invoiceDate: new Date(),
      selectedBanks: quotation.selectedBanks || ['Dashen Bank', 'Commercial Bank of Ethiopia'],
      selectedBank: quotation.selectedBanks?.[0] || 'Dashen Bank',
      bankDetails: quotation.bankDetails || '',
      notes: `Converted from Quotation #${quotation.quotationNumber}. ${quotation.notes || ''}`.trim(),
    });

    const savedInvoice = await invoice.save();

    // Update Quotation status and link to invoice
    quotation.status = QuotationStatus.CONVERTED;
    quotation.convertedInvoiceId = savedInvoice.id;
    quotation.convertedInvoiceNumber = savedInvoice.invoiceNumber;
    quotation.history.push({
      action: 'CONVERTED_TO_INVOICE',
      performedBy: user?.email || 'admin@weventurehub.com',
      timestamp: new Date(),
      note: `Successfully converted to invoice ${savedInvoice.invoiceNumber}`,
    });
    await quotation.save();

    if (user) {
      await this.logActivity(tid, user, 'CONVERT_QUOTATION_TO_INVOICE', quotation.id, {
        quotationNumber: quotation.quotationNumber,
        invoiceNumber: savedInvoice.invoiceNumber,
        invoiceId: savedInvoice.id,
      });
    }

    return {
      quotation,
      invoice: savedInvoice,
      message: `Quotation converted successfully to Invoice ${savedInvoice.invoiceNumber}`,
    };
  }

  /**
   * Generate PDF Document buffer for a Quotation matching WeVentureHub official design
   */
  public async generateQuotationPdfBuffer(quotation: IQuotationDocument): Promise<Buffer> {
    const PDFDocumentModule = await import('pdfkit');
    const PDFDocument = PDFDocumentModule.default || (PDFDocumentModule as any);

    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 35 });
        const buffers: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err: any) => reject(err));

        const primaryColor = '#65A30D';
        const darkColor = '#111827';
        const textGray = '#4B5563';
        const lightGray = '#F9FAFB';
        const borderGray = '#E5E7EB';

        // 1. TOP BRANDING HEADER — WEVENTURE LOGO + HEADER TEXT ABOVE LEMON LINE
        doc.save();
        const logoX = 35;
        const logoY = 30;
        doc.circle(logoX + 7, logoY + 8, 7).fill('#0B0E2A'); // Left Navy Node
        doc.circle(logoX + 28, logoY + 8, 7).fill('#84CC16'); // Right Green Node
        doc.circle(logoX + 17.5, logoY + 23, 7).fill('#84CC16'); // Bottom Green Node
        doc
          .path(
            `M ${logoX + 7} ${logoY + 8} Q ${logoX + 12} ${logoY + 16} ${logoX + 17.5} ${logoY + 23} Q ${logoX + 10} ${logoY + 17} ${logoX + 7} ${logoY + 8} Z`
          )
          .fill('#0B0E2A');
        doc
          .path(
            `M ${logoX + 28} ${logoY + 8} Q ${logoX + 23} ${logoY + 16} ${logoX + 17.5} ${logoY + 23} Q ${logoX + 25} ${logoY + 17} ${logoX + 28} ${logoY + 8} Z`
          )
          .fill('#84CC16');
        doc.restore();

        doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(22).text('WEVENTURE', logoX + 42, logoY, { align: 'left' });
        doc
          .fillColor('#84CC16')
          .font('Helvetica-Bold')
          .fontSize(8.5)
          .text('EVENT & WORKSPACE MANAGEMENT PLATFORM', logoX + 42, logoY + 24, { align: 'left' });

        // THE VIBRANT LEMON GREEN ACCENT LINE
        doc.rect(35, 68, 525, 3.5).fill('#84CC16');

        // OFFICIAL QUOTATION META BANNER UNDER LEMON LINE
        doc.save();
        doc.roundedRect(35, 76, 525, 26, 4).fill('#111827');
        doc.fillColor('#84CC16').font('Helvetica-Bold').fontSize(10).text('OFFICIAL QUOTATION', 45, 84);
        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(12).text(quotation.quotationNumber, 175, 83);
        const qDateStr = new Date(quotation.quotationDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
        doc
          .fillColor('#D1D5DB')
          .font('Helvetica-Bold')
          .fontSize(9)
          .text(`Date Issued: ${qDateStr}`, 350, 84, { width: 200, align: 'right' });
        doc.restore();

        // 2. SUPPLIER INFORMATION & QUOTATION ISSUED TO (BELOW META BANNER)
        let currentY = 110;
        const gridBoxY = currentY;
        const gridHeight = 82;

        // Draw grid box matching invoice structure
        doc.save();
        doc.roundedRect(35, gridBoxY, 525, gridHeight, 6).fillAndStroke(lightGray, borderGray);
        doc.restore();

        // Left Column: Supplier Information
        let sY = gridBoxY + 8;
        doc.fillColor(textGray).font('Helvetica-Bold').fontSize(9.5).text('SUPPLIER INFORMATION:', 45, sY);
        sY += 13;
        doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(10.5).text(WEVENTURE_SUPPLIER_INFO.companyName, 45, sY);
        sY += 13;
        doc.fillColor(textGray).font('Helvetica').fontSize(9).text(`Address: ${WEVENTURE_SUPPLIER_INFO.address}`, 45, sY);
        sY += 12;
        doc.fillColor(textGray).font('Helvetica').fontSize(9).text('Email: info@weventurehub.com | Tel: 0911243503', 45, sY);
        sY += 12;
        doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(9).text(`Prepared By: ${quotation.preparedBy || 'Commercial Sales Team'}`, 45, sY);

        // Right Column: Quotation Issued To
        let cY = gridBoxY + 8;
        doc.fillColor(textGray).font('Helvetica-Bold').fontSize(9.5).text('QUOTATION ISSUED TO:', 305, cY);
        cY += 13;
        doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(10.5).text(quotation.customerName || 'N/A', 305, cY, { width: 245 });
        cY += 13;
        if (quotation.companyName) {
          doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(9).text(quotation.companyName, 305, cY, { width: 245 });
          cY += 12;
        }
        if (quotation.tinNumber) {
          doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(9).text(`Customer TIN: ${quotation.tinNumber}`, 305, cY);
          cY += 12;
        }
        doc.fillColor(textGray).font('Helvetica').fontSize(9).text(`Email: ${quotation.email || 'N/A'}${quotation.phone ? ` | Tel: ${quotation.phone}` : ''}`, 305, cY, { width: 245 });

        // 3. QUOTATION ITEMS TABLE
        const tableTop = gridBoxY + gridHeight + 8;
        doc.save().rect(35, tableTop, 525, 18).fill(darkColor);

        doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9.5);
        doc.text('Description', 45, tableTop + 4.5);
        doc.text('Qty', 320, tableTop + 4.5, { width: 40, align: 'center' });
        doc.text(`Unit Rate (${quotation.currency})`, 370, tableTop + 4.5, { width: 90, align: 'right' });
        doc.text(`Total Amount (${quotation.currency})`, 465, tableTop + 4.5, { width: 85, align: 'right' });
        doc.restore();

        currentY = tableTop + 18;
        const items = quotation.items && quotation.items.length > 0 ? quotation.items : [{
          itemName: 'Workspace Rental Package',
          quantity: 1,
          unitPrice: quotation.grandTotal || 0,
          amount: quotation.grandTotal || 0
        }];

        items.forEach((item: any) => {
          doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(9.5);
          doc.text(item.itemName || 'Item', 45, currentY + 3.5, { width: 265 });

          let rowHeight = 18;
          if (item.description) {
            doc.fillColor(textGray).font('Helvetica').fontSize(8);
            doc.text(item.description, 45, currentY + 13, { width: 265 });
            rowHeight = 25;
          }

          doc.fillColor(darkColor).font('Helvetica').fontSize(9.5);
          doc.text(String(item.quantity || 1), 320, currentY + 3.5, { width: 40, align: 'center' });
          doc.text(`${(item.unitPrice || 0).toLocaleString()}`, 370, currentY + 3.5, { width: 90, align: 'right' });
          doc.font('Helvetica-Bold').text(`${(item.amount || 0).toLocaleString()}`, 465, currentY + 3.5, { width: 85, align: 'right' });

          currentY += rowHeight;
          doc.strokeColor(borderGray).lineWidth(0.5).moveTo(35, currentY).lineTo(560, currentY).stroke();
        });

        // 4. LOWER SECTION: AMOUNT IN WORDS, PAYMENT SETTLEMENT BANKS & PAYMENT TERM (LEFT) & GRAND TOTAL / AMENITIES (RIGHT)
        const totalsY = currentY + 8;
        const currencyVal = quotation.currency || 'ETB';
        const totalVal = quotation.grandTotal || 0;
        const wordsText = quotation.amountInWords || numberToWords(totalVal, currencyVal);

        // LEFT COLUMN: AMOUNT IN WORDS + PAYMENT TERM + PAYMENT SETTLEMENT BANKS (EXACT INVOICE MATCH)
        doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(10).text('AMOUNT IN WORDS:', 35, totalsY);
        doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10).text(wordsText, 35, totalsY + 12, { width: 285 });

        // PAYMENT TERM (Clearly visible, font size 10 consistent with Invoice main text)
        let payInfoY = totalsY + 36;
        const paymentTermText = quotation.paymentTerms || quotation.notes || '100% advance payment upon quotation acceptance / prior to space handover.';
        doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(10).text('PAYMENT TERM:', 35, payInfoY);
        doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(9.5).text(paymentTermText, 35, payInfoY + 12, { width: 285 });

        const termHeight = doc.heightOfString(paymentTermText, { width: 285 });
        payInfoY = payInfoY + 12 + termHeight + 6;

        // SETTLEMENT BANK OPTIONS (ALL 5 BANKS VERTICAL MATCHING INVOICE)
        doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(10).text('PAYMENT SETTLEMENT BANKS:', 35, payInfoY);

        let bankY = payInfoY + 13;
        const bankRecords = WEVENTURE_BANKS;
        bankRecords.forEach((bank, idx) => {
          const optionTitle = `Bank Option ${idx + 1}: ${bank.bankName}`;
          doc.font('Helvetica-Bold').fontSize(10).fillColor(darkColor).text(optionTitle, 35, bankY, { width: 280 });

          const titleHeight = doc.heightOfString(optionTitle, { width: 280 });
          const detailsY = bankY + titleHeight + 2;

          const detailsText = `Acc Name: ${bank.accountName}\nAcc No: ${bank.accountNumber} | Branch: ${bank.branch}`;
          doc.font('Helvetica').fontSize(9.5).fillColor(textGray).text(detailsText, 45, detailsY, { width: 275 });

          const detailsHeight = doc.heightOfString(detailsText, { width: 275 });
          bankY = detailsY + detailsHeight + 4; // Space for next bank
        });

        // RIGHT COLUMN: FINANCIAL BREAKDOWN (GRAND TOTAL) + AMENITIES + EXCHANGE RATE
        let rightY = totalsY;

        if (quotation.discount > 0) {
          doc.fillColor(primaryColor).font('Helvetica').fontSize(9.5);
          doc.text('Discount Applied:', 340, rightY);
          doc.text(`-${(quotation.discount || 0).toLocaleString()} ${currencyVal}`, 465, rightY, { align: 'right', width: 85 });
          rightY += 13;
        }

        // Grand Total Row matching Invoice styling
        doc.strokeColor('#111827').lineWidth(1.2).moveTo(340, rightY).lineTo(560, rightY).stroke();
        rightY += 4;

        doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(12);
        doc.text('Grand Total:', 340, rightY);
        doc.fillColor(primaryColor).text(`${totalVal.toLocaleString()} ${currencyVal}`, 440, rightY, { align: 'right', width: 110 });
        rightY += 15;

        // VAT INCLUSIVE STATEMENT
        doc.fillColor(textGray).font('Helvetica').fontSize(8.5).text('All amounts are inclusive of VAT.', 340, rightY, { align: 'right', width: 210 });
        rightY += 12;

        if (quotation.currency === 'USD') {
          doc.strokeColor(borderGray).lineWidth(0.5).moveTo(340, rightY).lineTo(560, rightY).stroke();
          rightY += 4;
          doc.fillColor(textGray).font('Helvetica').fontSize(8.5).text(`Exchange Rate: 1 USD = ${quotation.exchangeRate || 153.09} Birr`, 340, rightY);
          rightY += 11;
          doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(9).text('Equivalent in ETB:', 340, rightY);
          doc.fillColor('#92400E').text(`${(quotation.convertedEtbTotal || 0).toLocaleString()} ETB`, 440, rightY, { align: 'right', width: 110 });
          rightY += 15;
        }

        // INCLUDED AMENITIES & FACILITIES (Right Column under Grand Total)
        const defaultStandardAmenities = [
          'High-Speed Dedicated Fiber Wi-Fi',
          '24/7 Power Backup (Generator & UPS)',
          'Executive Meeting Room Credits',
          'Unlimited Coffee, Tea & Refreshments',
          'High-Volume Printing/Scanning',
          'Professional Reception & Mail Handling',
        ];

        const amenitiesToRender = quotation.amenities && quotation.amenities.length > 0
          ? quotation.amenities
          : defaultStandardAmenities;

        rightY += 6;
        doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(9.5).text('INCLUDED AMENITIES & FACILITIES:', 340, rightY);
        rightY += 13;

        amenitiesToRender.slice(0, 7).forEach((amen) => {
          doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(8.5).text('✓', 340, rightY);
          const amenText = String(amen || '');
          const textHeight = doc.heightOfString(amenText, { width: 195, lineGap: 1.2 });
          doc.fillColor(textGray).font('Helvetica').fontSize(8.5).text(amenText, 352, rightY, { width: 195, lineGap: 1.2 });
          rightY += Math.max(textHeight, 10) + 3.5;
        });

        // 5. STABLE SINGLE-PAGE FOOTER SIGNATURES (Anchored to exact bottom range of standard A4)
        const footerY = 750;
        doc.strokeColor(borderGray).lineWidth(0.75).moveTo(35, footerY - 8).lineTo(560, footerY - 8).stroke();

        doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(9).text('WeVentureHub Finance Department', 35, footerY);
        doc.fillColor(textGray).font('Helvetica').fontSize(8).text('Thank you for choosing WeVentureHub Workspace Solutions!', 35, footerY + 11);

        // Signature line
        doc.strokeColor('#6B7280').lineWidth(0.75).moveTo(380, footerY + 8).lineTo(540, footerY + 8).stroke();
        doc.fillColor(darkColor).font('Helvetica-Bold').fontSize(8.5).text('Authorized Stamp & Signature', 380, footerY + 12, { width: 160, align: 'center' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Send Quotation by Email with PDF Attachment
   */
  public async sendQuotationEmail(
    tenantId: string,
    id: string,
    recipientEmail?: string,
    customMessage?: string,
    user?: IUserIdentity
  ): Promise<any> {
    const tid = tenantId || 'weventurehub';
    const quotation = await this.getQuotationById(id, tid);
    if (!quotation) {
      throw new NotFoundError('Quotation not found');
    }

    const to = (recipientEmail || quotation.email).trim();
    if (!to) {
      throw new ValidationError('Recipient email address is required');
    }

    // Generate PDF Buffer
    const pdfBuffer = await this.generateQuotationPdfBuffer(quotation);

    // Format HTML Email Template (No Subtotal/VAT breakdown, includes 5 banks and Grand Total)
    const itemsHtml = quotation.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; font-weight: bold; color: #111827;">${item.itemName}</td>
        <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: center; color: #4B5563;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: right; color: #4B5563;">${item.unitPrice.toLocaleString()} ${quotation.currency}</td>
        <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: right; font-weight: bold; color: #111827;">${item.amount.toLocaleString()} ${quotation.currency}</td>
      </tr>
    `
      )
      .join('');

    const banksHtml = WEVENTURE_BANKS.map(
      (b, idx) => `
      <div style="margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #E2E8F0; font-size: 12px;">
        <strong style="color: #0F172A;">Bank Option ${idx + 1}: ${b.bankName}</strong><br/>
        <span style="color: #64748B;">Account Name:</span> ${b.accountName} | <span style="color: #64748B;">Branch:</span> ${b.branch}<br/>
        <strong style="color: #0F172A; font-family: monospace;">Account Number: ${b.accountNumber}</strong>
      </div>
    `
    ).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #F9FAFB; padding: 24px; color: #111827;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E5E7EB; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <div style="background-color: #0F172A; padding: 24px; text-align: center;">
            <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">WEVENTURE<span style="color: #84CC16;">HUB</span></h1>
            <p style="color: #84CC16; margin: 4px 0 0 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">Official Workspace & Event Quotation</p>
          </div>
          
          <div style="padding: 24px;">
            <p style="font-size: 16px; color: #111827; margin-top: 0;">Dear <strong>${quotation.customerName}</strong>,</p>
            <p style="color: #4B5563; line-height: 1.5;">${customMessage || 'We are pleased to provide you with the official quotation for workspace solutions at WeVentureHub. Please find the quotation summary and attached PDF below:'}</p>
            
            <div style="background-color: #F8FAFC; border-radius: 12px; padding: 16px; margin: 20px 0; border: 1px solid #E2E8F0;">
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="color: #64748B; padding-bottom: 6px;">Quotation Number:</td>
                  <td style="text-align: right; font-weight: bold; color: #0F172A;">${quotation.quotationNumber}</td>
                </tr>
                <tr>
                  <td style="color: #64748B; padding-bottom: 6px;">Quotation Date:</td>
                  <td style="text-align: right; color: #0F172A;">${new Date(quotation.quotationDate).toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td style="color: #64748B;">Grand Total:</td>
                  <td style="text-align: right; font-weight: 800; color: #65A30D; font-size: 18px;">Grand Total: ${quotation.grandTotal.toLocaleString()} ${quotation.currency} ${quotation.currency === 'USD' ? `(${quotation.convertedEtbTotal.toLocaleString()} ETB)` : ''}</td>
                </tr>
              </table>
              <div style="margin-top: 8px; font-size: 12px; color: #65A30D; font-weight: bold;">
                Amount in Words: ${quotation.amountInWords || numberToWords(quotation.grandTotal, quotation.currency)}
              </div>
            </div>

            <h3 style="font-size: 14px; text-transform: uppercase; color: #64748B; margin-bottom: 8px;">Quoted Services</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #0F172A; color: #FFFFFF;">
                  <th style="padding: 8px; text-align: left;">Item</th>
                  <th style="padding: 8px; text-align: center;">Qty</th>
                  <th style="padding: 8px; text-align: right;">Rate</th>
                  <th style="padding: 8px; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="background-color: #F8FAFC; border-radius: 12px; padding: 14px; margin-bottom: 16px; border: 1px solid #E2E8F0;">
              <h4 style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; color: #64748B;">Included Amenities:</h4>
              <p style="margin: 0; font-size: 12px; color: #334155; line-height: 1.6;">
                ✓ Free Wi-Fi &nbsp;•&nbsp; ✓ Electronic devices &nbsp;•&nbsp; ✓ Sound system &nbsp;•&nbsp; ✓ TV screens &nbsp;•&nbsp; ✓ Microphones &nbsp;•&nbsp; ✓ Free use of printer
              </p>
            </div>

            <div style="margin-bottom: 16px;">
              <h4 style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; color: #64748B;">Payment Settlement Banks:</h4>
              ${banksHtml}
            </div>

            <p style="color: #64748B; font-size: 12px; line-height: 1.5; border-top: 1px solid #E5E7EB; padding-top: 14px;">
              <strong>Payment Terms:</strong> ${quotation.paymentTerms || 'Payment is due upon quotation acceptance.'}
            </p>
          </div>
          
          <div style="background-color: #F1F5F9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0;">
            <p style="margin: 0; font-weight: bold; color: #0F172A;">WeVentureHub Finance Department</p>
            <p style="margin: 2px 0 0 0;">Thank you for choosing WeVentureHub Workspace Solutions!</p>
            <p style="margin: 4px 0 0 0; font-size: 11px;">Kirkos Sub City, W. 02 H. No New, Addis Ababa | Tel: 0911243503 | Email: info@weventurehub.com</p>
          </div>
        </div>
      </div>
    `;

    // Dynamic import to avoid cycle
    const { emailService } = await import('./EmailService');

    const emailPayload: EmailPayload = {
      to,
      subject: `Official Quotation ${quotation.quotationNumber} - WeVentureHub`,
      html,
      category: 'invoice',
      tenantId: tid,
      recipientName: quotation.customerName,
      attachments: [
        {
          filename: `Quotation-${quotation.quotationNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    const sent = await emailService.sendEmail(emailPayload);

    // Update status to Sent if it was Draft
    if (quotation.status === QuotationStatus.DRAFT) {
      quotation.status = QuotationStatus.SENT;
    }
    quotation.history.push({
      action: 'EMAIL_SENT',
      performedBy: user?.email || 'admin@weventurehub.com',
      timestamp: new Date(),
      note: `Quotation PDF emailed to ${to}`,
    });
    await quotation.save();

    if (user) {
      await this.logActivity(tid, user, 'EMAIL_QUOTATION', quotation.id, {
        recipient: to,
        quotationNumber: quotation.quotationNumber,
        emailSuccess: sent,
      });
    }

    return {
      success: true,
      recipient: to,
      quotationNumber: quotation.quotationNumber,
      sentAt: new Date().toISOString(),
    };
  }
}

export const quotationService = new QuotationService();

import mongoose, { Schema, Document } from 'mongoose';

export enum QuotationStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  VIEWED = 'Viewed',
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
  EXPIRED = 'Expired',
  CONVERTED = 'Converted to Invoice',
}

export interface IQuotationItem {
  serviceId?: string;
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface IQuotationHistoryItem {
  action: string;
  performedBy: string;
  timestamp: Date;
  note?: string;
}

export interface IQuotationDocument extends Document {
  id: string;
  tenantId: string;
  quotationNumber: string; // e.g. QUO-WV-1001
  customerId?: string;
  userId?: string;
  customerName: string;
  companyName?: string;
  tinNumber?: string;
  email: string;
  phone?: string;
  address?: string;
  quotationDate: Date;
  validUntil?: Date;
  preparedBy: string;
  salespersonEmail?: string;
  currency: 'USD' | 'ETB';
  exchangeRate: number; // e.g. 153.09
  items: IQuotationItem[];
  subtotal: number;
  vat: number; // 15% VAT
  discount: number;
  grandTotal: number;
  convertedEtbTotal: number;
  amountInWords?: string;
  amenities: string[];
  selectedBanks: string[];
  bankDetails?: string;
  notes?: string;
  paymentTerms?: string;
  status: QuotationStatus | string;
  convertedInvoiceId?: string;
  convertedInvoiceNumber?: string;
  history: IQuotationHistoryItem[];
  createdAt: Date;
  updatedAt: Date;
}

const QuotationItemSchema = new Schema<IQuotationItem>(
  {
    serviceId: { type: String },
    itemName: { type: String, required: true },
    description: { type: String },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true, min: 0, default: 0 },
    amount: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

const QuotationHistorySchema = new Schema<IQuotationHistoryItem>(
  {
    action: { type: String, required: true },
    performedBy: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String },
  },
  { _id: false }
);

const QuotationSchema = new Schema<IQuotationDocument>(
  {
    tenantId: { type: String, required: true, default: 'weventurehub', index: true },
    quotationNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, index: true },
    userId: { type: String, index: true },
    customerName: { type: String, required: true },
    companyName: { type: String },
    tinNumber: { type: String },
    email: { type: String, required: true, index: true },
    phone: { type: String },
    address: { type: String },
    quotationDate: { type: Date, required: true, default: Date.now },
    validUntil: { type: Date, required: false },
    preparedBy: { type: String, default: 'WeVentureHub Team' },
    salespersonEmail: { type: String },
    currency: { type: String, enum: ['USD', 'ETB'], default: 'USD' },
    exchangeRate: { type: Number, default: 153.09 },
    items: [QuotationItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    vat: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true, default: 0 },
    convertedEtbTotal: { type: Number, required: true, default: 0 },
    amountInWords: { type: String },
    amenities: [{ type: String }],
    selectedBanks: [{ type: String }],
    bankDetails: { type: String },
    notes: {
      type: String,
      default: 'Thank you for choosing WeVentureHub. This quotation is valid until the date specified above.',
    },
    paymentTerms: {
      type: String,
      default: 'Payment is due upon acceptance of quotation. All payments should be transferred to our designated bank accounts.',
    },
    status: {
      type: String,
      enum: Object.values(QuotationStatus),
      default: QuotationStatus.DRAFT,
      required: true,
      index: true,
    },
    convertedInvoiceId: { type: String, index: true },
    convertedInvoiceNumber: { type: String },
    history: [QuotationHistorySchema],
  },
  {
    timestamps: true,
    collection: 'quotations',
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : '';
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : '';
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

QuotationSchema.index({ tenantId: 1, status: 1 });
QuotationSchema.index({ tenantId: 1, email: 1 });
QuotationSchema.index({ tenantId: 1, customerName: 1 });

export const Quotation: mongoose.Model<IQuotationDocument> =
  (mongoose.models.Quotation as any) || mongoose.model<IQuotationDocument>('Quotation', QuotationSchema);

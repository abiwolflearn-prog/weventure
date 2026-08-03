import mongoose, { Schema, Document } from 'mongoose';

export enum InvoiceStatus {
  DRAFT = 'Draft',
  PENDING = 'Pending Payment',
  PARTIALLY_PAID = 'Partially Paid',
  PAID = 'Paid',
  OVERDUE = 'Overdue',
  CANCELLED = 'Cancelled',
  UNPAID = 'Pending Payment',
  VOID = 'Cancelled',
  REFUNDED = 'Cancelled',
}

export interface IInvoiceDocument extends Document {
  id: string;
  tenantId: string;
  userId: string;
  customerId?: string;
  userEmail: string;
  invoiceNumber: string; // INV-YYYYMMDD-XXXX
  orderId?: string;
  bookingId?: string;
  reservationId?: string;
  paymentId?: string;
  amount: number;
  currency: string;
  status: string;
  customerType?: 'Individual' | 'Company';
  billingDetails: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    address?: string;
    taxId?: string;
  };
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
  durationType?: 'Hourly' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  durationQuantity?: number;
  unitPrice?: number;
  dueDate?: Date;
  paidAt?: Date;
  agreementId?: string;
  agreementNumber?: string;
  workspaceId?: string;
  workspaceName?: string;
  billingPeriod?: string;
  invoiceDate?: Date;
  vat?: number;
  discount?: number;
  deposit?: number;
  grandTotal?: number;
  previousBalance?: number;
  currentBalance?: number;
  outstandingBalance?: number;
  qrCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoiceDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    customerId: { type: String, index: true },
    userEmail: { type: String, required: true, index: true },
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, index: true },
    bookingId: { type: String, index: true },
    reservationId: { type: String, index: true },
    paymentId: { type: String, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'ETB' },
    status: {
      type: String,
      default: InvoiceStatus.PENDING,
      required: true,
      index: true,
    },
    customerType: { type: String, enum: ['Individual', 'Company'], default: 'Individual' },
    billingDetails: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String },
      company: { type: String },
      address: { type: String },
      taxId: { type: String },
    },
    lineItems: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        amount: { type: Number, required: true, min: 0 },
      },
    ],
    durationType: { type: String },
    durationQuantity: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    dueDate: { type: Date },
    paidAt: { type: Date },
    agreementId: { type: String, index: true },
    agreementNumber: { type: String },
    workspaceId: { type: String },
    workspaceName: { type: String },
    billingPeriod: { type: String },
    invoiceDate: { type: Date },
    vat: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    deposit: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    previousBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    outstandingBalance: { type: Number, default: 0 },
    qrCode: { type: String },
  },
  {
    timestamps: true,
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

export const Invoice = mongoose.model<IInvoiceDocument>('Invoice', InvoiceSchema);

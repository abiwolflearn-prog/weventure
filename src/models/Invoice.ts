import mongoose, { Schema, Document } from 'mongoose';

export enum InvoiceStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  VOID = 'VOID',
  REFUNDED = 'REFUNDED',
}

export interface IInvoiceDocument extends Document {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  invoiceNumber: string; // INV-YYYYMMDD-XXXX
  orderId?: string;
  bookingId?: string;
  paymentId?: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
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
  dueDate?: Date;
  paidAt?: Date;
  agreementNumber?: string;
  workspaceId?: string;
  workspaceName?: string;
  billingPeriod?: string;
  invoiceDate?: Date;
  vat?: number;
  discount?: number;
  deposit?: number;
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
    userEmail: { type: String, required: true, index: true },
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, index: true },
    bookingId: { type: String, index: true },
    paymentId: { type: String, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'ETB' },
    status: {
      type: String,
      enum: Object.values(InvoiceStatus),
      default: InvoiceStatus.UNPAID,
      required: true,
      index: true,
    },
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
    dueDate: { type: Date },
    paidAt: { type: Date },
    agreementNumber: { type: String },
    workspaceId: { type: String },
    workspaceName: { type: String },
    billingPeriod: { type: String },
    invoiceDate: { type: Date },
    vat: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    deposit: { type: Number, default: 0 },
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

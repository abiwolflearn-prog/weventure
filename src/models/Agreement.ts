import mongoose, { Schema, Document } from 'mongoose';

export interface IAgreementDocument extends Document {
  id: string;
  tenantId: string;
  agreementNumber: string; // AGR-YYYYMMDD-XXXX
  bookingId: string;
  userId: string;
  userEmail: string;
  workspaceId: string;
  workspaceName: string;
  billingPlan: {
    name: 'Hourly' | 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
    price: number;
    currency: string;
    deposit?: number;
    paymentDueDay?: number;
    vat?: number;
    discount?: number;
    gracePeriod?: number;
    lateFee?: number;
  };
  startDate: Date;
  endDate: Date;
  agreementDate: Date;
  status: 'PENDING_SIGNATURE' | 'ACTIVE' | 'TERMINATED' | 'COMPLETED' | 'EXPIRED';
  rules: {
    internet?: string;
    meetingRoom?: string;
    parking?: string;
    utilities?: string;
    workingHours?: string;
    renewalPolicy?: 'Automatic' | 'Manual';
    cancellationPolicy?: string;
    terminationPolicy?: string;
    visitorPolicy?: string;
    additionalNotes?: string;
  };
  customerSignature?: {
    signed: boolean;
    name: string;
    date?: Date;
    ipAddress?: string;
  };
  adminSignature?: {
    signed: boolean;
    name: string;
    date?: Date;
  };
  terms: string;
  conditions: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const AgreementSchema = new Schema<IAgreementDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    agreementNumber: { type: String, required: true, unique: true, index: true },
    bookingId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true, index: true },
    workspaceId: { type: String, required: true, index: true },
    workspaceName: { type: String, required: true },
    billingPlan: {
      name: { type: String, required: true },
      price: { type: Number, required: true },
      currency: { type: String, default: 'ETB' },
      deposit: { type: Number, default: 0 },
      paymentDueDay: { type: Number, default: 5 },
      vat: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      gracePeriod: { type: Number, default: 5 },
      lateFee: { type: Number, default: 0 },
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    agreementDate: { type: Date, default: Date.now, required: true },
    status: {
      type: String,
      enum: ['PENDING_SIGNATURE', 'ACTIVE', 'TERMINATED', 'COMPLETED', 'EXPIRED'],
      default: 'PENDING_SIGNATURE',
      required: true,
      index: true,
    },
    rules: {
      internet: { type: String, default: 'Included' },
      meetingRoom: { type: String, default: 'Included' },
      parking: { type: String, default: 'Optional' },
      utilities: { type: String, default: 'Included' },
      workingHours: { type: String, default: '24/7' },
      renewalPolicy: { type: String, enum: ['Automatic', 'Manual'], default: 'Manual' },
      cancellationPolicy: { type: String, default: 'Standard' },
      terminationPolicy: { type: String, default: 'Standard' },
      visitorPolicy: { type: String, default: 'Allowed under guest policy' },
      additionalNotes: { type: String },
    },
    customerSignature: {
      signed: { type: Boolean, default: false },
      name: { type: String },
      date: { type: Date },
      ipAddress: { type: String },
    },
    adminSignature: {
      signed: { type: Boolean, default: false },
      name: { type: String },
      date: { type: Date },
    },
    terms: { type: String, required: true },
    conditions: { type: String, required: true },
    version: { type: Number, default: 1, required: true },
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

export const Agreement = mongoose.model<IAgreementDocument>('Agreement', AgreementSchema);

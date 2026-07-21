import mongoose, { Schema, Document } from 'mongoose';

export interface IRenewalHistoryItem {
  renewedAt: Date;
  originalEndTime: Date;
  newEndTime: Date;
  pricePaid: number;
}

export interface IBookingDocument extends Document {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  spaceId: string;
  startTime: Date;
  endTime: Date;
  totalAmount: number;
  status: 'PENDING_APPROVAL' | 'PENDING_REVIEW' | 'APPROVED' | 'AGREEMENT_GENERATED' | 'CUSTOMER_ACCEPTED' | 'CONFIRMED' | 'CANCELLED' | 'REJECTED' | 'RENEWED' | 'COMPLETED';
  purpose?: string;
  qrCode: string;
  billingPlanId?: string;
  billingPlanName?: 'Hourly' | 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
  signedAgreementText?: string;
  signedAt?: Date;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  billingDetails?: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    address?: string;
  };
  teamSize?: number;
  notes?: string;
  documentUrl?: string;
  agreementId?: string;
  renewalHistory?: IRenewalHistoryItem[];
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBookingDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true, index: true },
    spaceId: { type: String, required: true, index: true },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true, index: true },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['PENDING_APPROVAL', 'PENDING_REVIEW', 'APPROVED', 'AGREEMENT_GENERATED', 'CUSTOMER_ACCEPTED', 'CONFIRMED', 'CANCELLED', 'REJECTED', 'RENEWED', 'COMPLETED'],
      default: 'PENDING_APPROVAL',
      required: true,
      index: true,
    },
    purpose: { type: String, trim: true },
    qrCode: { type: String, required: true },
    billingPlanId: { type: String },
    billingPlanName: { type: String, enum: ['Hourly', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'] },
    signedAgreementText: { type: String },
    signedAt: { type: Date },
    emergencyContact: {
      name: { type: String },
      relationship: { type: String },
      phone: { type: String },
    },
    billingDetails: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
      company: { type: String },
      address: { type: String },
    },
    teamSize: { type: Number, min: 1 },
    notes: { type: String },
    documentUrl: { type: String },
    agreementId: { type: String },
    renewalHistory: [
      {
        renewedAt: { type: Date, default: Date.now },
        originalEndTime: { type: Date },
        newEndTime: { type: Date },
        pricePaid: { type: Number },
      }
    ],
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

// Compounded index to enforce multi-tenant isolation and ease timeline operations
BookingSchema.index({ tenantId: 1, spaceId: 1, startTime: 1, endTime: 1 });
BookingSchema.index({ tenantId: 1, userId: 1, status: 1 });

export const Booking = mongoose.model<IBookingDocument>('Booking', BookingSchema);

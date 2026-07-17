import mongoose, { Schema, Document } from 'mongoose';

export enum RefundStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface IRefundDocument extends Document {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  paymentId: string;
  refundReference: string; // REF-XXXXXX
  amount: number;
  reason: string;
  status: RefundStatus;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RefundSchema = new Schema<IRefundDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true, index: true },
    paymentId: { type: String, required: true, index: true },
    refundReference: { type: String, required: true, unique: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(RefundStatus),
      default: RefundStatus.PENDING,
      required: true,
      index: true,
    },
    approvedBy: { type: String },
    approvedAt: { type: Date },
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

export const Refund = mongoose.model<IRefundDocument>('Refund', RefundSchema);

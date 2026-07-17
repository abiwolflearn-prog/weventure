import mongoose, { Schema, Document } from 'mongoose';

export enum TransactionType {
  CHARGE = 'CHARGE',
  REFUND = 'REFUND',
  PAYOUT = 'PAYOUT',
}

export interface ITransactionDocument extends Document {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  paymentId?: string;
  reference: string; // unique ledger ref
  amount: number;
  type: TransactionType;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransactionDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true, index: true },
    paymentId: { type: String, index: true },
    reference: { type: String, required: true, unique: true, index: true },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
      index: true,
    },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
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

export const Transaction = mongoose.model<ITransactionDocument>('Transaction', TransactionSchema);

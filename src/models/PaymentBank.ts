import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentBankDocument extends Document {
  id: string;
  tenantId: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  swiftCode?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentBankSchema = new Schema<IPaymentBankDocument>(
  {
    tenantId: { type: String, required: true, default: 'weventurehub', index: true },
    bankName: { type: String, required: true },
    accountName: { type: String, required: true, default: 'WE VENTURE HOLDINGS PLC' },
    accountNumber: { type: String, required: true },
    branch: { type: String, required: true },
    swiftCode: { type: String },
    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'payment_banks',
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

PaymentBankSchema.index({ tenantId: 1, bankName: 1 });

export const PaymentBank: mongoose.Model<IPaymentBankDocument> =
  (mongoose.models.PaymentBank as any) || mongoose.model<IPaymentBankDocument>('PaymentBank', PaymentBankSchema);

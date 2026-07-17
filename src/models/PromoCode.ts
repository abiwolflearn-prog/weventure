import mongoose, { Schema, Document } from 'mongoose';

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export interface IPromoCodeDocument extends Document {
  id: string;
  tenantId: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  maxUses?: number;
  usesCount: number;
  expiryDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PromoCodeSchema = new Schema<IPromoCodeDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    code: { type: String, required: true, index: true },
    discountType: {
      type: String,
      enum: Object.values(DiscountType),
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    maxUses: { type: Number },
    usesCount: { type: Number, required: true, default: 0 },
    expiryDate: { type: Date },
    isActive: { type: Boolean, required: true, default: true },
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

// Compound index to ensure code is unique per tenant
PromoCodeSchema.index({ tenantId: 1, code: 1 }, { unique: true });

export const PromoCode = mongoose.model<IPromoCodeDocument>('PromoCode', PromoCodeSchema);

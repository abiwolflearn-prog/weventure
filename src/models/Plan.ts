import mongoose, { Schema, Document } from 'mongoose';

export interface IPlanDocument extends Omit<Document, '_id'> {
  _id: string; // Slug/ID, e.g. 'free', 'growth', 'enterprise', or uuid for custom plans
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  limits: {
    maxWorkspaces: number;
    maxEvents: number;
    maxUsers: number;
    maxStorageMB: number;
    maxApiRequests: number;
  };
  featureFlags: Record<string, boolean>;
  isCustom: boolean; // True for tenant-specific custom deals
  tenantId?: string; // Associated tenant if isCustom is true
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlanDocument>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    priceMonthly: { type: Number, required: true, min: 0 },
    priceYearly: { type: Number, required: true, min: 0 },
    limits: {
      maxWorkspaces: { type: Number, required: true, min: 0 },
      maxEvents: { type: Number, required: true, min: 0 },
      maxUsers: { type: Number, required: true, min: 0 },
      maxStorageMB: { type: Number, required: true, min: 0, default: 1024 }, // in MB
      maxApiRequests: { type: Number, required: true, min: 0, default: 10000 }, // per cycle
    },
    featureFlags: {
      type: Map,
      of: Boolean,
      default: {},
    },
    isCustom: { type: Boolean, default: false, required: true },
    tenantId: { type: String, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Plan = mongoose.model<IPlanDocument>('Plan', PlanSchema);

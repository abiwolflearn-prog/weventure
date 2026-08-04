import mongoose, { Schema, Document } from 'mongoose';

export interface IPricingRuleDocument extends Document {
  id: string;
  tenantId: string;
  resourceId?: string;
  resourceType: string; // e.g., "Event Space", "Training Room", "Meeting Room", "Workspace Membership", "Workspace"
  resourceName: string; // e.g., "Event Space", "Training Room", "Meeting Room", "Dedicated Desk", "Small Private Office", "Large Private Office"
  pricingType: string; // "Duration-Based", "Fixed", etc.
  billingCycle: 'Hourly' | 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly' | 'Half Day' | 'Full Day' | 'Up to 2 Hours' | string;
  minimumDuration: number; // e.g., in hours
  maximumDuration: number; // e.g., in hours
  basePrice: number;
  vatPercentage: number;
  totalPrice: number;
  currency: string;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PricingRuleSchema = new Schema<IPricingRuleDocument>(
  {
    tenantId: { type: String, required: true, default: 'weventurehub', index: true },
    resourceId: { type: String, index: true },
    resourceType: { type: String, required: true, index: true },
    resourceName: { type: String, required: true, index: true },
    pricingType: { type: String, default: 'Duration-Based' },
    billingCycle: { type: String, required: true },
    minimumDuration: { type: Number, default: 0 },
    maximumDuration: { type: Number, default: 999999 },
    basePrice: { type: Number, required: true, min: 0 },
    vatPercentage: { type: Number, default: 15 },
    totalPrice: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', required: true },
    effectiveFrom: { type: Date },
    effectiveTo: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: String, default: 'system' },
    updatedBy: { type: String, default: 'system' },
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

PricingRuleSchema.index({ tenantId: 1, resourceName: 1, isActive: 1 });

export const PricingRule = mongoose.model<IPricingRuleDocument>('PricingRule', PricingRuleSchema);

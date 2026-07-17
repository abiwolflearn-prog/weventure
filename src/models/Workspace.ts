import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkspaceDocument extends Document {
  id: string;
  tenantId: string;
  name: string;
  type: 'HOT_DESK' | 'MEETING_ROOM' | 'EVENT_VENUE';
  capacity: number;
  hourlyRate: number;
  dailyRate?: number; // Daily pricing
  packagePricing?: { name: string; hours: number; price: number }[]; // Package rates
  dynamicPricingRules?: {
    ruleName: string;
    type: 'weekend' | 'peak_hour' | 'seasonal';
    modifierType: 'percentage' | 'fixed';
    modifierValue: number; // e.g. 15 for 15% or 10 for $10
    startHour?: number;
    endHour?: number;
    startMonth?: number; // 1-12
    endMonth?: number;
  }[];
  currency: string;
  amenities: string[];
  isAvailable: boolean;
  availabilityRules: {
    startHour: number; // e.g. 8 for 08:00
    endHour: number;   // e.g. 20 for 20:00
    allowedDays: number[]; // e.g. [1, 2, 3, 4, 5] for Mon-Fri
  };
  bufferTime: number; // in minutes (e.g. 15 or 30 mins)
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspaceDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['HOT_DESK', 'MEETING_ROOM', 'EVENT_VENUE'],
      required: true,
      index: true,
    },
    capacity: { type: Number, required: true, min: 1 },
    hourlyRate: { type: Number, required: true, min: 0 },
    dailyRate: { type: Number, min: 0 },
    packagePricing: [
      {
        name: { type: String, required: true },
        hours: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
      }
    ],
    dynamicPricingRules: [
      {
        ruleName: { type: String, required: true },
        type: { type: String, enum: ['weekend', 'peak_hour', 'seasonal'], required: true },
        modifierType: { type: String, enum: ['percentage', 'fixed'], required: true },
        modifierValue: { type: Number, required: true },
        startHour: { type: Number },
        endHour: { type: Number },
        startMonth: { type: Number },
        endMonth: { type: Number },
      }
    ],
    currency: { type: String, default: 'USD', required: true },
    amenities: [{ type: String }],
    isAvailable: { type: Boolean, default: true, required: true },
    availabilityRules: {
      startHour: { type: Number, default: 0, required: true },
      endHour: { type: Number, default: 24, required: true },
      allowedDays: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6], required: true },
    },
    bufferTime: { type: Number, default: 0, required: true },
    isDeleted: { type: Boolean, default: false, required: true, index: true },
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

// Compounded index for name searching and multi-tenant performance
WorkspaceSchema.index({ tenantId: 1, isDeleted: 1, name: 1 });

export const Workspace = mongoose.model<IWorkspaceDocument>('Workspace', WorkspaceSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface ITenantUsageDocument extends Document {
  tenantId: string;
  workspacesCount: number;
  eventsCount: number;
  usersCount: number;
  storageUsageMB: number;
  apiUsageCount: number;
  billingCycleStart: Date;
  billingCycleEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TenantUsageSchema = new Schema<ITenantUsageDocument>(
  {
    tenantId: { type: String, required: true, unique: true, index: true },
    workspacesCount: { type: Number, required: true, default: 0, min: 0 },
    eventsCount: { type: Number, required: true, default: 0, min: 0 },
    usersCount: { type: Number, required: true, default: 0, min: 0 },
    storageUsageMB: { type: Number, required: true, default: 0, min: 0 },
    apiUsageCount: { type: Number, required: true, default: 0, min: 0 },
    billingCycleStart: { type: Date, required: true, default: Date.now },
    billingCycleEnd: { type: Date, required: true, default: () => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      return d;
    }},
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

export const TenantUsage = mongoose.model<ITenantUsageDocument>('TenantUsage', TenantUsageSchema);

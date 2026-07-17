import mongoose, { Schema, Document } from 'mongoose';

export interface ITenantAuditLogDocument extends Document {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  action: string;
  ipAddress?: string;
  details?: Record<string, any>;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TenantAuditLogSchema = new Schema<ITenantAuditLogDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true },
    action: { type: String, required: true, index: true },
    ipAddress: { type: String },
    details: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, required: true, index: true },
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

TenantAuditLogSchema.index({ tenantId: 1, timestamp: -1 });

export const TenantAuditLog = mongoose.model<ITenantAuditLogDocument>('TenantAuditLog', TenantAuditLogSchema);

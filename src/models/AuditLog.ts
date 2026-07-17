import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLogDocument extends Document {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  action: string;
  resourceType: 'EVENT' | 'WORKSPACE' | 'BOOKING' | 'TICKET' | 'REGISTRATION' | 'ORDER' | 'PAYMENT' | 'TRANSACTION' | 'INVOICE' | 'REFUND';
  resourceId: string;
  details?: Record<string, any>;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true },
    action: { type: String, required: true, index: true },
    resourceType: { 
      type: String, 
      required: true, 
      enum: ['EVENT', 'WORKSPACE', 'BOOKING', 'TICKET', 'REGISTRATION', 'ORDER', 'PAYMENT', 'TRANSACTION', 'INVOICE', 'REFUND'], 
      index: true 
    },
    resourceId: { type: String, required: true, index: true },
    details: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, required: true, index: true },
  },
  {
    timestamps: false,
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

export const AuditLog = mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);

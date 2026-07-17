import mongoose, { Schema, Document } from 'mongoose';

export interface ICrmActivityDocument extends Document {
  id: string;
  tenantId: string;
  contactId?: string | mongoose.Types.ObjectId;
  leadId?: string | mongoose.Types.ObjectId;
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'EVENT_REGISTRATION' | 'TICKET_PURCHASE' | 'WORKSPACE_BOOKING' | 'TASK' | 'SYSTEM';
  title: string;
  description?: string;
  date: Date;
  assignedTo?: string;
  outcome?: string;
  details?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const CrmActivitySchema = new Schema<ICrmActivityDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', index: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
    type: {
      type: String,
      enum: ['CALL', 'EMAIL', 'MEETING', 'NOTE', 'EVENT_REGISTRATION', 'TICKET_PURCHASE', 'WORKSPACE_BOOKING', 'TASK', 'SYSTEM'],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    date: { type: Date, default: Date.now, required: true, index: true },
    assignedTo: { type: String, trim: true },
    outcome: { type: String, trim: true },
    details: { type: Schema.Types.Mixed, default: {} },
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

CrmActivitySchema.index({ tenantId: 1, type: 1 });
CrmActivitySchema.index({ tenantId: 1, date: -1 });

export const CrmActivity = mongoose.model<ICrmActivityDocument>('CrmActivity', CrmActivitySchema);

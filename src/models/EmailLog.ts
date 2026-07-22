import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailLogDocument extends Document {
  tenantId: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  category: string;
  templateKey: string;
  status: 'delivered' | 'failed' | 'opened' | 'clicked';
  sentAt: Date;
  errorMessage?: string;
  messageId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const EmailLogSchema = new Schema<IEmailLogDocument>(
  {
    tenantId: { type: String, required: true, default: 'weventurehub', index: true },
    recipientEmail: { type: String, required: true, index: true },
    recipientName: { type: String },
    subject: { type: String, required: true },
    category: { type: String, required: true, index: true },
    templateKey: { type: String, required: true, index: true },
    status: { type: String, enum: ['delivered', 'failed', 'opened', 'clicked'], default: 'delivered', index: true },
    sentAt: { type: Date, default: Date.now, index: true },
    errorMessage: { type: String },
    messageId: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

export const EmailLog =
  (mongoose.models.EmailLog as mongoose.Model<IEmailLogDocument>) ||
  mongoose.model<IEmailLogDocument>('EmailLog', EmailLogSchema);

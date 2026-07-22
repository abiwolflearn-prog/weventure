import mongoose, { Schema, Document } from 'mongoose';

export type QueuePriority = 'high' | 'normal' | 'low';
export type QueueStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';

export interface IEmailQueueDocument extends Document {
  tenantId: string;
  templateKey: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  bodyHtml: string;
  variables?: Record<string, any>;
  priority: QueuePriority;
  status: QueueStatus;
  scheduledFor: Date;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  sentAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const EmailQueueSchema = new Schema<IEmailQueueDocument>(
  {
    tenantId: { type: String, required: true, default: 'weventurehub', index: true },
    templateKey: { type: String, required: true, index: true },
    recipientEmail: { type: String, required: true, index: true },
    recipientName: { type: String },
    subject: { type: String, required: true },
    bodyHtml: { type: String, required: true },
    variables: { type: Schema.Types.Mixed },
    priority: { type: String, enum: ['high', 'normal', 'low'], default: 'normal', index: true },
    status: { type: String, enum: ['pending', 'processing', 'sent', 'failed', 'cancelled'], default: 'pending', index: true },
    scheduledFor: { type: Date, default: Date.now, index: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    lastError: { type: String },
    sentAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

// Compound index for queue processing
EmailQueueSchema.index({ status: 1, scheduledFor: 1, priority: 1 });

export const EmailQueue =
  (mongoose.models.EmailQueue as mongoose.Model<IEmailQueueDocument>) ||
  mongoose.model<IEmailQueueDocument>('EmailQueue', EmailQueueSchema);

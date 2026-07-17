import mongoose, { Schema, Document } from 'mongoose';

export enum NotificationCategory {
  EVENT = 'EVENT',
  BOOKING = 'BOOKING',
  PAYMENT = 'PAYMENT',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  SYSTEM = 'SYSTEM',
}

export interface INotificationDocument extends Document {
  id: string;
  tenantId: string;
  userId: string;
  title: string;
  message: string;
  category: NotificationCategory;
  isRead: boolean;
  readAt?: Date;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    category: {
      type: String,
      enum: Object.values(NotificationCategory),
      default: NotificationCategory.SYSTEM,
      required: true,
      index: true,
    },
    isRead: { type: Boolean, default: false, required: true, index: true },
    readAt: { type: Date },
    link: { type: String },
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

// Compound index for quick fetching user notifications ordered by date
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotificationDocument>('Notification', NotificationSchema);

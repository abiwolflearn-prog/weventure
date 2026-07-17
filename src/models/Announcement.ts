import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../types';

export enum AnnouncementTarget {
  ALL = 'ALL',
  HUB_MEMBER = 'HUB_MEMBER',
  STAFF = 'STAFF',
  EXTERNAL_USER = 'EXTERNAL_USER',
}

export interface IAnnouncementDocument extends Document {
  id: string;
  tenantId: string;
  title: string;
  content: string;
  targetAudience: AnnouncementTarget;
  scheduledFor?: Date;
  isPublished: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncementDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    targetAudience: {
      type: String,
      enum: Object.values(AnnouncementTarget),
      default: AnnouncementTarget.ALL,
      required: true,
      index: true,
    },
    scheduledFor: { type: Date, index: true },
    isPublished: { type: Boolean, default: true, required: true, index: true },
    createdBy: { type: String, required: true },
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

// Indexes
AnnouncementSchema.index({ tenantId: 1, isPublished: 1, scheduledFor: 1, createdAt: -1 });

export const Announcement = mongoose.model<IAnnouncementDocument>('Announcement', AnnouncementSchema);

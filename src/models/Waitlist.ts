import mongoose, { Schema, Document } from 'mongoose';
import { WaitlistStatus } from '../types';

export interface IWaitlistDocument extends Document {
  id: string;
  tenantId: string;
  eventId: string;
  ticketTypeId?: string;
  userId: string;
  userEmail: string;
  name: string;
  status: WaitlistStatus;
  joinedAt: Date;
  promotedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WaitlistSchema = new Schema<IWaitlistDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    eventId: { type: String, required: true, index: true },
    ticketTypeId: { type: String },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: Object.values(WaitlistStatus),
      default: WaitlistStatus.WAITLISTED,
      required: true,
      index: true,
    },
    joinedAt: { type: Date, default: Date.now, required: true },
    promotedAt: { type: Date },
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

WaitlistSchema.index({ tenantId: 1, eventId: 1, userId: 1 }, { unique: true });

export const Waitlist = mongoose.model<IWaitlistDocument>('Waitlist', WaitlistSchema);

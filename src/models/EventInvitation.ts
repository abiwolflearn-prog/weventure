import mongoose, { Schema, Document } from 'mongoose';

export interface IEventInvitationDocument extends Document {
  id: string;
  tenantId: string;
  eventId: string;
  email: string;
  name: string;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED';
  invitedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventInvitationSchema = new Schema<IEventInvitationDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    eventId: { type: String, required: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REVOKED'],
      default: 'PENDING',
      required: true,
      index: true,
    },
    invitedBy: { type: String, required: true },
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

EventInvitationSchema.index({ tenantId: 1, eventId: 1, email: 1 }, { unique: true });

export const EventInvitation = mongoose.model<IEventInvitationDocument>('EventInvitation', EventInvitationSchema);

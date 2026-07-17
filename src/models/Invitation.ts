import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../types';

export interface IInvitationDocument extends Document {
  id: string;
  email: string;
  tenantId: string;
  role: UserRole;
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED';
  invitedBy: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema = new Schema<IInvitationDocument>(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    tenantId: { type: String, required: true, index: true },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.HUB_MEMBER,
      required: true,
    },
    token: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'EXPIRED'],
      default: 'PENDING',
      required: true,
    },
    invitedBy: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
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

export const Invitation = mongoose.model<IInvitationDocument>('Invitation', InvitationSchema);

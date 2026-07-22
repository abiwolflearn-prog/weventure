import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../types';

export interface IUserDocument extends Document {
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string;
  passwordHash?: string;
  role: UserRole;
  phone?: string;
  company?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    tenantId: { type: String, required: true, default: 'weventurehub' },
    email: { type: String, required: true, lowercase: true, trim: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    name: { type: String },
    passwordHash: { type: String },
    role: { type: String, required: true, default: UserRole.HUB_MEMBER },
    phone: { type: String },
    company: { type: String },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1, tenantId: 1 }, { unique: true });

export const User =
  (mongoose.models.User as mongoose.Model<IUserDocument>) ||
  mongoose.model<IUserDocument>('User', UserSchema);

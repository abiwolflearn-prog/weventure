import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../types';

export interface IUserDocument extends Document {
  tenantId: string;
  userType?: 'individual' | 'group' | 'company';
  email: string;
  firstName: string;
  lastName: string;
  name?: string;
  passwordHash?: string;
  role: UserRole;
  phone?: string;
  company?: string;
  profileImage?: string;
  companyInfo?: {
    companyName?: string;
    companyLogo?: string;
    companyCover?: string;
    address?: string;
    industry?: string;
    employees?: number;
  };
  isEmailVerified?: boolean;
  emailVerificationToken?: string;
  emailVerificationOtp?: string;
  emailVerificationExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    tenantId: { type: String, required: true, default: 'weventurehub' },
    userType: { type: String, enum: ['individual', 'group', 'company'], default: 'individual' },
    email: { type: String, required: true, lowercase: true, trim: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    name: { type: String },
    passwordHash: { type: String },
    role: { type: String, required: true, default: UserRole.HUB_MEMBER },
    phone: { type: String },
    company: { type: String },
    profileImage: { type: String },
    companyInfo: {
      companyName: { type: String },
      companyLogo: { type: String },
      companyCover: { type: String },
      address: { type: String },
      industry: { type: String },
      employees: { type: Number },
    },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationOtp: { type: String },
    emailVerificationExpires: { type: Date },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1, tenantId: 1 }, { unique: true });

export const User =
  (mongoose.models.User as mongoose.Model<IUserDocument>) ||
  mongoose.model<IUserDocument>('User', UserSchema);

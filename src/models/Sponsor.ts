import mongoose, { Schema, Document } from 'mongoose';

export interface ISponsorDocument extends Document {
  id: string;
  tenantId: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string;
  tier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SponsorSchema = new Schema<ISponsorDocument>(
  {
    tenantId: { type: String, required: true, default: 'weventurehub', index: true },
    name: { type: String, required: true, trim: true },
    logoUrl: { type: String, required: true },
    websiteUrl: { type: String },
    tier: {
      type: String,
      enum: ['Platinum', 'Gold', 'Silver', 'Bronze'],
      default: 'Gold',
      required: true,
    },
    isPublished: { type: Boolean, default: true, required: true, index: true },
  },
  {
    timestamps: true,
    collection: 'sponsors',
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

export const Sponsor = mongoose.models.Sponsor || mongoose.model<ISponsorDocument>('Sponsor', SponsorSchema);

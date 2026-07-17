import mongoose, { Schema, Document } from 'mongoose';

export interface IPartnerDocument extends Document {
  id: string;
  tenantId: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string;
  type: 'Technology' | 'Academic' | 'Venture' | 'Community' | 'Government';
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PartnerSchema = new Schema<IPartnerDocument>(
  {
    tenantId: { type: String, required: true, default: 'weventurehub', index: true },
    name: { type: String, required: true, trim: true },
    logoUrl: { type: String, required: true },
    websiteUrl: { type: String },
    type: {
      type: String,
      enum: ['Technology', 'Academic', 'Venture', 'Community', 'Government'],
      default: 'Community',
      required: true,
    },
    isPublished: { type: Boolean, default: true, required: true, index: true },
  },
  {
    timestamps: true,
    collection: 'partners',
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

export const Partner = mongoose.models.Partner || mongoose.model<IPartnerDocument>('Partner', PartnerSchema);

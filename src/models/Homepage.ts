import mongoose, { Schema, Document } from 'mongoose';

export interface IHomepageDocument extends Document {
  id: string;
  tenantId: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  heroCtaLink: string;
  heroImageUrl: string;
  promotionTitle: string;
  promotionSubtitle: string;
  promotionImageUrl: string;
  promotionPrice: string;
  communityHighlights: {
    title: string;
    description: string;
    imageUrl?: string;
  }[];
  startupPrograms: {
    title: string;
    description: string;
    duration: string;
    cohortSize: number;
    ctaText: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const HomepageSchema = new Schema<IHomepageDocument>(
  {
    tenantId: { type: String, required: true, default: 'weventurehub', unique: true, index: true },
    heroTitle: { type: String, required: true },
    heroSubtitle: { type: String, required: true },
    heroCtaText: { type: String, required: true },
    heroCtaLink: { type: String, required: true },
    heroImageUrl: { type: String, required: true },
    promotionTitle: { type: String, required: true },
    promotionSubtitle: { type: String, required: true },
    promotionImageUrl: { type: String, required: true },
    promotionPrice: { type: String, required: true },
    communityHighlights: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
        imageUrl: { type: String },
      }
    ],
    startupPrograms: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
        duration: { type: String, required: true },
        cohortSize: { type: Number, required: true },
        ctaText: { type: String, required: true },
      }
    ],
  },
  {
    timestamps: true,
    collection: 'homepage',
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

export const Homepage = mongoose.models.Homepage || mongoose.model<IHomepageDocument>('Homepage', HomepageSchema);

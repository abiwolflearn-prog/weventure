import mongoose, { Schema, Document } from 'mongoose';

export interface ITeamMember {
  name: string;
  role: string;
  bio?: string;
  imageUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
}

export interface ITimelineItem {
  year: string;
  title: string;
  description: string;
}

export interface IAboutPageDocument extends Document {
  id: string;
  tenantId: string;
  mission: string;
  vision: string;
  companyDescription: string;
  history: string;
  coreValues: { title: string; description: string; icon?: string }[];
  teamMembers: ITeamMember[];
  timeline: ITimelineItem[];
  heroImageUrl?: string;
  videoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AboutPageSchema = new Schema<IAboutPageDocument>(
  {
    tenantId: { type: String, required: true, default: 'weventurehub', unique: true, index: true },
    mission: { type: String, required: true },
    vision: { type: String, required: true },
    companyDescription: { type: String, required: true },
    history: { type: String, default: '' },
    coreValues: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
        icon: { type: String },
      },
    ],
    teamMembers: [
      {
        name: { type: String, required: true },
        role: { type: String, required: true },
        bio: { type: String },
        imageUrl: { type: String },
        linkedinUrl: { type: String },
        twitterUrl: { type: String },
      },
    ],
    timeline: [
      {
        year: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
      },
    ],
    heroImageUrl: { type: String },
    videoUrl: { type: String },
  },
  {
    timestamps: true,
    collection: 'about_page',
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

export const AboutPage = mongoose.models.AboutPage || mongoose.model<IAboutPageDocument>('AboutPage', AboutPageSchema);

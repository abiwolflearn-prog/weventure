import mongoose, { Schema, Document } from 'mongoose';

export interface ICompanyInfoDocument extends Document {
  id: string;
  tenantId: string;
  companyName: string;
  tagline: string;
  description: string;
  phoneNumbers: string[];
  emailAddresses: string[];
  officeAddress: string;
  city: string;
  country: string;
  workingHours: string;
  emergencyContact: string;
  googleMapEmbedUrl: string;
  socialMediaLinks: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
    telegram?: string;
  };
  logoUrl?: string;
  faviconUrl?: string;
  footerText?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompanyInfoSchema = new Schema<ICompanyInfoDocument>(
  {
    tenantId: { type: String, required: true, default: 'weventurehub', unique: true, index: true },
    companyName: { type: String, required: true, default: 'WeVentureHub' },
    tagline: { type: String, default: 'The Premier Entrepreneurship & Coworking Hub in Addis Ababa' },
    description: { type: String, default: 'WeVentureHub empowers African startups, founders, and enterprises with world-class workspaces and event acceleration.' },
    phoneNumbers: [{ type: String }],
    emailAddresses: [{ type: String }],
    officeAddress: { type: String, default: 'Bole Road, Next to Sunshine Building, Addis Ababa, Ethiopia' },
    city: { type: String, default: 'Addis Ababa' },
    country: { type: String, default: 'Ethiopia' },
    workingHours: { type: String, default: 'Mon - Sat: 8:00 AM - 10:00 PM | Sun: Closed' },
    emergencyContact: { type: String, default: '+251 911 000 000' },
    googleMapEmbedUrl: { type: String, default: 'https://maps.google.com' },
    socialMediaLinks: {
      facebook: { type: String, default: 'https://facebook.com/weventurehub' },
      twitter: { type: String, default: 'https://twitter.com/weventurehub' },
      linkedin: { type: String, default: 'https://linkedin.com/company/weventurehub' },
      instagram: { type: String, default: 'https://instagram.com/weventurehub' },
      telegram: { type: String, default: 'https://t.me/weventurehub' },
    },
    logoUrl: { type: String, default: '/logo.png' },
    faviconUrl: { type: String, default: '/favicon.ico' },
    footerText: { type: String, default: '© 2026 WeVentureHub. All rights reserved.' },
  },
  {
    timestamps: true,
    collection: 'company_info',
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

export const CompanyInfo = mongoose.models.CompanyInfo || mongoose.model<ICompanyInfoDocument>('CompanyInfo', CompanyInfoSchema);

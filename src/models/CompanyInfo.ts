import mongoose, { Schema, Document } from 'mongoose';

export interface ICompanyInfoDocument extends Document {
  id: string;
  tenantId: string;
  companyName: string;
  legalName?: string;
  tagline: string;
  description: string;
  phoneNumbers: string[];
  emailAddresses: string[];
  officeAddress: string;
  city: string;
  country: string;
  website?: string;
  tinNumber?: string;
  vatRegNo?: string;
  businessRegistrationInfo?: string;
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
  // Document Configuration
  invoicePrefix?: string;
  quotationPrefix?: string;
  receiptPrefix?: string;
  invoiceNextNumber?: number;
  quotationNextNumber?: number;
  receiptNextNumber?: number;
  signatureImageUrl?: string;
  stampImageUrl?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  defaultDocumentFooter?: string;
  // Tax & Pricing
  vatInclusiveQuotations?: boolean;
  defaultVatRate?: number;
  exchangeRate?: number;
  defaultCurrency?: string;
  // Booking Rules
  bookingRules?: {
    minDurationHours?: number;
    bufferMinutes?: number;
    advanceNoticeHours?: number;
    maxAdvanceDays?: number;
    autoApprove?: boolean;
    cancellationHours?: number;
    cancellationRefundPercentage?: number;
    eventDepositPercentage?: number;
    eventReviewRequired?: boolean;
    cancellationPolicyText?: string;
  };
  // Amenities List
  amenitiesList?: string[];
  // Platform Preferences
  platformPreferences?: {
    defaultLanguage?: string;
    dateFormat?: string;
    timeZone?: string;
    defaultCurrency?: string;
    enableAmharic?: boolean;
    emailNotificationsEnabled?: boolean;
    inAppNotificationsEnabled?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CompanyInfoSchema = new Schema<ICompanyInfoDocument>(
  {
    tenantId: { type: String, required: true, default: 'weventurehub', unique: true, index: true },
    companyName: { type: String, required: true, default: 'WeVentureHub' },
    legalName: { type: String, default: 'WE VENTURE HOLDINGS PLC' },
    tagline: { type: String, default: 'The Premier Entrepreneurship & Coworking Hub in Addis Ababa' },
    description: { type: String, default: 'WeVentureHub empowers African startups, founders, and enterprises with world-class workspaces and event acceleration.' },
    phoneNumbers: [{ type: String, default: '091 124 3503' }],
    emailAddresses: [{ type: String, default: 'info@weventurehub.com' }],
    officeAddress: { type: String, default: 'Bole Road, Sur Construction Building, 2nd Floor, Addis Ababa, Ethiopia' },
    city: { type: String, default: 'Addis Ababa' },
    country: { type: String, default: 'Ethiopia' },
    website: { type: String, default: 'https://weventurehub.com' },
    tinNumber: { type: String, default: '0082788884' },
    vatRegNo: { type: String, default: '23130180002' },
    businessRegistrationInfo: { type: String, default: 'Trade License No. 04/2/18944/16 • Ministry of Trade and Regional Integration, Addis Ababa' },
    workingHours: { type: String, default: 'Mon - Sat: 8:00 AM - 10:00 PM | Sun: Closed' },
    emergencyContact: { type: String, default: '091 124 3503' },
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
    // Document defaults
    invoicePrefix: { type: String, default: 'INV-WV-' },
    quotationPrefix: { type: String, default: 'QUO-WV-' },
    receiptPrefix: { type: String, default: 'REC-WV-' },
    invoiceNextNumber: { type: Number, default: 1001 },
    quotationNextNumber: { type: Number, default: 1001 },
    receiptNextNumber: { type: Number, default: 1001 },
    signatureImageUrl: { type: String, default: '' },
    stampImageUrl: { type: String, default: '' },
    signatoryName: { type: String, default: 'Authorized Managing Director' },
    signatoryTitle: { type: String, default: 'General Operations & Finance Lead' },
    defaultDocumentFooter: { type: String, default: 'WeVentureHub • Empowering Innovation & African Startups • Bole Road, Addis Ababa, Ethiopia' },
    // Tax & Pricing defaults
    vatInclusiveQuotations: { type: Boolean, default: true },
    defaultVatRate: { type: Number, default: 15 },
    exchangeRate: { type: Number, default: 153.09 },
    defaultCurrency: { type: String, default: 'ETB' },
    // Booking Rules defaults
    bookingRules: {
      minDurationHours: { type: Number, default: 1 },
      bufferMinutes: { type: Number, default: 15 },
      advanceNoticeHours: { type: Number, default: 2 },
      maxAdvanceDays: { type: Number, default: 90 },
      autoApprove: { type: Boolean, default: true },
      cancellationHours: { type: Number, default: 24 },
      cancellationRefundPercentage: { type: Number, default: 100 },
      eventDepositPercentage: { type: Number, default: 20 },
      eventReviewRequired: { type: Boolean, default: true },
      cancellationPolicyText: { type: String, default: 'Free cancellation up to 24 hours before reservation time. Cancellations made within 24 hours are subject to a 50% cancellation fee.' },
    },
    // Amenities List defaults
    amenitiesList: [
      {
        type: String,
      },
    ],
    // Platform Preferences defaults
    platformPreferences: {
      defaultLanguage: { type: String, default: 'English (US)' },
      dateFormat: { type: String, default: 'DD/MM/YYYY' },
      timeZone: { type: String, default: 'Africa/Addis_Ababa (UTC+3)' },
      defaultCurrency: { type: String, default: 'ETB' },
      enableAmharic: { type: Boolean, default: true },
      emailNotificationsEnabled: { type: Boolean, default: true },
      inAppNotificationsEnabled: { type: Boolean, default: true },
    },
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


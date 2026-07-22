import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailBranding {
  logoUrl?: string;
  headerBgColor?: string;
  primaryColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  fontFamily?: string;
  companyName?: string;
  companyAddress?: string;
  supportEmail?: string;
  supportPhone?: string;
  footerText?: string;
  signatureText?: string;
}

export interface IEmailTemplateDocument extends Document {
  tenantId: string;
  templateKey: string;
  name: string;
  category: 'auth' | 'booking' | 'invoice' | 'renewal' | 'event' | 'support' | 'admin';
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  branding?: IEmailBranding;
  isSystem: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmailTemplateSchema = new Schema<IEmailTemplateDocument>(
  {
    tenantId: { type: String, required: true, default: 'weventurehub', index: true },
    templateKey: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ['auth', 'booking', 'invoice', 'renewal', 'event', 'support', 'admin'],
      default: 'booking',
    },
    subject: { type: String, required: true },
    bodyHtml: { type: String, required: true },
    bodyText: { type: String },
    branding: {
      logoUrl: { type: String },
      headerBgColor: { type: String, default: '#0f172a' },
      primaryColor: { type: String, default: '#3b82f6' },
      buttonBgColor: { type: String, default: '#3b82f6' },
      buttonTextColor: { type: String, default: '#ffffff' },
      fontFamily: { type: String, default: "'Inter', system-ui, sans-serif" },
      companyName: { type: String, default: 'WeVentureHub' },
      companyAddress: { type: String, default: 'Airport Road, Sur Construction second floor, Addis Ababa' },
      supportEmail: { type: String, default: 'info@weventurehub.com' },
      supportPhone: { type: String, default: '091 124 3503' },
      footerText: { type: String, default: 'You are receiving this automated email as a valued member or guest of WeVentureHub.' },
      signatureText: { type: String, default: 'The WeVentureHub Community & Operations Team' },
    },
    isSystem: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const EmailTemplate =
  (mongoose.models.EmailTemplate as mongoose.Model<IEmailTemplateDocument>) ||
  mongoose.model<IEmailTemplateDocument>('EmailTemplate', EmailTemplateSchema);

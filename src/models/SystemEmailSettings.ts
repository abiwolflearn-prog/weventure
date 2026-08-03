import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminEmails {
  primaryAdminEmail: string;
  secondaryAdminEmail: string;
  billingEmail: string;
  supportEmail: string;
  contactEmail: string;
}

export interface ISenders {
  defaultSender: string;
  supportSender: string;
  billingSender: string;
  notificationsSender: string;
}

export interface ISystemEmailSettings {
  tenantId: string;
  adminEmails: IAdminEmails;
  senders: ISenders;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISystemEmailSettingsDocument extends ISystemEmailSettings, Document {}

const SystemEmailSettingsSchema = new Schema<ISystemEmailSettingsDocument>(
  {
    tenantId: { type: String, required: true, default: 'weventurehub', unique: true },
    adminEmails: {
      primaryAdminEmail: { type: String, default: 'abiwolflearn@gmail.com' },
      secondaryAdminEmail: { type: String, default: 'abiwolflearn@gmail.com' },
      billingEmail: { type: String, default: 'abiwolflearn@gmail.com' },
      supportEmail: { type: String, default: 'abiwolflearn@gmail.com' },
      contactEmail: { type: String, default: 'abiwolflearn@gmail.com' },
    },
    senders: {
      defaultSender: { type: String, default: 'WeVentureHub <onboarding@resend.dev>' },
      supportSender: { type: String, default: 'WeVentureHub <onboarding@resend.dev>' },
      billingSender: { type: String, default: 'WeVentureHub <onboarding@resend.dev>' },
      notificationsSender: { type: String, default: 'WeVentureHub <onboarding@resend.dev>' },
    },
  },
  { timestamps: true }
);

export const SystemEmailSettings =
  (mongoose.models.SystemEmailSettings as mongoose.Model<ISystemEmailSettingsDocument>) ||
  mongoose.model<ISystemEmailSettingsDocument>('SystemEmailSettings', SystemEmailSettingsSchema);

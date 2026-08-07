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
      primaryAdminEmail: { type: String, default: 'info@weventurehub.com' },
      secondaryAdminEmail: { type: String, default: 'info@weventurehub.com' },
      billingEmail: { type: String, default: 'info@weventurehub.com' },
      supportEmail: { type: String, default: 'info@weventurehub.com' },
      contactEmail: { type: String, default: 'info@weventurehub.com' },
    },
    senders: {
      defaultSender: { type: String, default: 'WeVentureHub <info@weventurehub.com>' },
      supportSender: { type: String, default: 'WeVentureHub <info@weventurehub.com>' },
      billingSender: { type: String, default: 'WeVentureHub <info@weventurehub.com>' },
      notificationsSender: { type: String, default: 'WeVentureHub <info@weventurehub.com>' },
    },
  },
  { timestamps: true }
);

export const SystemEmailSettings =
  (mongoose.models.SystemEmailSettings as mongoose.Model<ISystemEmailSettingsDocument>) ||
  mongoose.model<ISystemEmailSettingsDocument>('SystemEmailSettings', SystemEmailSettingsSchema);

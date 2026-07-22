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
      primaryAdminEmail: { type: String, default: 'admin@weventurehub.com' },
      secondaryAdminEmail: { type: String, default: 'operations@weventurehub.com' },
      billingEmail: { type: String, default: 'billing@weventurehub.com' },
      supportEmail: { type: String, default: 'support@weventurehub.com' },
      contactEmail: { type: String, default: 'contact@weventurehub.com' },
    },
    senders: {
      defaultSender: { type: String, default: 'WeVentureHub <noreply@weventurehub.com>' },
      supportSender: { type: String, default: 'WeVentureHub Support <support@weventurehub.com>' },
      billingSender: { type: String, default: 'WeVentureHub Billing <billing@weventurehub.com>' },
      notificationsSender: { type: String, default: 'WeVentureHub Notifications <notifications@weventurehub.com>' },
    },
  },
  { timestamps: true }
);

export const SystemEmailSettings =
  (mongoose.models.SystemEmailSettings as mongoose.Model<ISystemEmailSettingsDocument>) ||
  mongoose.model<ISystemEmailSettingsDocument>('SystemEmailSettings', SystemEmailSettingsSchema);

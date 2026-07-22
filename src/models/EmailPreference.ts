import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailPreferenceDocument extends Document {
  tenantId: string;
  userId: string;
  userEmail: string;
  marketingEmails: boolean;
  bookingAlerts: boolean;
  paymentReminders: boolean;
  eventUpdates: boolean;
  securityAlerts: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmailPreferenceSchema = new Schema<IEmailPreferenceDocument>(
  {
    tenantId: { type: String, required: true, default: 'weventurehub', index: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true, index: true },
    marketingEmails: { type: Boolean, default: true },
    bookingAlerts: { type: Boolean, default: true },
    paymentReminders: { type: Boolean, default: true },
    eventUpdates: { type: Boolean, default: true },
    securityAlerts: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

EmailPreferenceSchema.index({ userId: 1, tenantId: 1 }, { unique: true });

export const EmailPreference =
  (mongoose.models.EmailPreference as mongoose.Model<IEmailPreferenceDocument>) ||
  mongoose.model<IEmailPreferenceDocument>('EmailPreference', EmailPreferenceSchema);

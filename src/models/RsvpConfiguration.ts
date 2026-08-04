import mongoose, { Document, Schema } from 'mongoose';

export interface IRsvpConfiguration extends Document {
  eventId: mongoose.Types.ObjectId | string;
  tenantId: string;
  draft: {
    fields: any[];
    appearance: any;
    emailSettings: any;
    ticketSettings: any;
    updatedAt: Date;
  };
  versions: {
    versionNumber: number;
    fields: any[];
    appearance: any;
    emailSettings: any;
    ticketSettings: any;
    createdAt: Date;
  }[];
  publishedVersion: number;
}

const RsvpConfigurationSchema = new Schema(
  {
    eventId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    draft: {
      fields: { type: Schema.Types.Mixed, default: [] },
      appearance: { type: Schema.Types.Mixed, default: {} },
      emailSettings: { type: Schema.Types.Mixed, default: {} },
      ticketSettings: { type: Schema.Types.Mixed, default: {} },
      updatedAt: { type: Date, default: Date.now },
    },
    versions: [
      {
        versionNumber: { type: Number, required: true },
        fields: { type: Schema.Types.Mixed, default: [] },
        appearance: { type: Schema.Types.Mixed, default: {} },
        emailSettings: { type: Schema.Types.Mixed, default: {} },
        ticketSettings: { type: Schema.Types.Mixed, default: {} },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    publishedVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Ensure only one configuration per event
RsvpConfigurationSchema.index({ eventId: 1, tenantId: 1 }, { unique: true });

export const RsvpConfiguration = mongoose.model<IRsvpConfiguration>('RsvpConfiguration', RsvpConfigurationSchema);

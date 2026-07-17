import mongoose, { Schema, Document } from 'mongoose';

export interface ILeadNote {
  author: string;
  content: string;
  createdAt: Date;
}

export interface ILeadDocument extends Document {
  id: string;
  tenantId: string;
  contactId?: string | mongoose.Types.ObjectId;
  companyId?: string | mongoose.Types.ObjectId;
  title: string;
  dealValue: number;
  pipelineStage: 'NEW' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';
  status: 'ACTIVE' | 'WON' | 'LOST' | 'ARCHIVED';
  customFields?: Record<string, any>;
  notes: ILeadNote[];
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILeadDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', index: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', index: true },
    title: { type: String, required: true, trim: true },
    dealValue: { type: Number, required: true, default: 0, min: 0 },
    pipelineStage: {
      type: String,
      enum: ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'],
      default: 'NEW',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'WON', 'LOST', 'ARCHIVED'],
      default: 'ACTIVE',
      required: true,
      index: true,
    },
    customFields: { type: Schema.Types.Mixed, default: {} },
    notes: [
      {
        author: { type: String, required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
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

LeadSchema.index({ tenantId: 1, pipelineStage: 1 });
LeadSchema.index({ tenantId: 1, status: 1 });

export const Lead = mongoose.model<ILeadDocument>('Lead', LeadSchema);

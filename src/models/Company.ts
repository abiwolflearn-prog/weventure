import mongoose, { Schema, Document } from 'mongoose';

export interface ICompanyDocument extends Document {
  id: string;
  tenantId: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  website?: string;
  phone?: string;
  tags: string[];
  customFields?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompanyDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    domain: { type: String, trim: true },
    industry: { type: String, trim: true },
    size: { type: String, trim: true },
    website: { type: String, trim: true },
    phone: { type: String, trim: true },
    tags: [{ type: String, index: true }],
    customFields: { type: Schema.Types.Mixed, default: {} },
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

CompanySchema.index({ tenantId: 1, name: 1 });

export const Company = mongoose.model<ICompanyDocument>('Company', CompanySchema);

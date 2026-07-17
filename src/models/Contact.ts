import mongoose, { Schema, Document } from 'mongoose';

export interface IContactNote {
  author: string;
  content: string;
  createdAt: Date;
}

export interface IContactDocument extends Document {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: 'ACTIVE' | 'LEAD' | 'INACTIVE';
  leadSource?: string;
  companyId?: string | mongoose.Types.ObjectId;
  tags: string[];
  customFields?: Record<string, any>;
  notes: IContactNote[];
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContactDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'LEAD', 'INACTIVE'],
      default: 'LEAD',
      required: true,
      index: true,
    },
    leadSource: { type: String, trim: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', index: true },
    tags: [{ type: String, index: true }],
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

// Compounded index for quick searches and tenant-isolated unique email rules
ContactSchema.index({ tenantId: 1, email: 1 });
ContactSchema.index({ tenantId: 1, firstName: 1, lastName: 1 });

export const Contact = mongoose.model<IContactDocument>('Contact', ContactSchema);

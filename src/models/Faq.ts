import mongoose, { Schema, Document } from 'mongoose';

export interface IFaqDocument extends Document {
  id: string;
  tenantId: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isPublished: boolean;
  isArchived?: boolean;
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FaqSchema = new Schema<IFaqDocument>(
  {
    tenantId: { type: String, required: true, default: 'weventurehub', index: true },
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true },
    category: { type: String, default: 'General', index: true },
    sortOrder: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true, index: true },
    isArchived: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    collection: 'faqs',
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

export const Faq = mongoose.models.Faq || mongoose.model<IFaqDocument>('Faq', FaqSchema);

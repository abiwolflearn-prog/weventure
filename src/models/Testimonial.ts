import mongoose, { Schema, Document } from 'mongoose';

export interface ITestimonialDocument extends Document {
  id: string;
  tenantId: string;
  authorName: string;
  authorRole: string;
  authorCompany: string;
  authorAvatarUrl?: string;
  content: string;
  rating: number;
  isFeatured: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TestimonialSchema = new Schema<ITestimonialDocument>(
  {
    tenantId: { type: String, required: true, default: 'weventurehub', index: true },
    authorName: { type: String, required: true, trim: true },
    authorRole: { type: String, required: true },
    authorCompany: { type: String, required: true },
    authorAvatarUrl: { type: String },
    content: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5, default: 5 },
    isFeatured: { type: Boolean, default: false, index: true },
    isPublished: { type: Boolean, default: true, required: true, index: true },
  },
  {
    timestamps: true,
    collection: 'testimonials',
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

export const Testimonial = mongoose.models.Testimonial || mongoose.model<ITestimonialDocument>('Testimonial', TestimonialSchema);

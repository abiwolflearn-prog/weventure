import mongoose, { Schema, Document } from 'mongoose';

export interface IReviewDocument extends Document {
  id: string;
  eventId: string;
  tenantId: string;
  reviewerName: string;
  reviewerEmail: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReviewDocument>(
  {
    eventId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    reviewerName: { type: String, required: true, trim: true },
    reviewerEmail: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
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

export const Review = mongoose.model<IReviewDocument>('Review', ReviewSchema);

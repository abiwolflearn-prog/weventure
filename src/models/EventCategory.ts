import mongoose, { Schema, Document } from 'mongoose';

export interface IEventCategoryDocument extends Document {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  slug: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EventCategorySchema = new Schema<IEventCategoryDocument>(
  {
    tenantId: { type: String, required: true, default: 'weventurehub', index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    slug: { type: String, required: true, trim: true, unique: true },
    isPublished: { type: Boolean, default: true, required: true, index: true },
  },
  {
    timestamps: true,
    collection: 'eventCategories',
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

export const EventCategory = mongoose.models.EventCategory || mongoose.model<IEventCategoryDocument>('EventCategory', EventCategorySchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IGalleryDocument extends Document {
  id: string;
  tenantId: string;
  title: string;
  imageUrls: string[];
  eventId?: string;
  workspaceId?: string;
  type: 'event' | 'workspace' | 'general';
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GallerySchema = new Schema<IGalleryDocument>(
  {
    tenantId: { type: String, required: true, default: 'weventurehub', index: true },
    title: { type: String, required: true },
    imageUrls: [{ type: String }],
    eventId: { type: String, index: true },
    workspaceId: { type: String, index: true },
    type: { type: String, enum: ['event', 'workspace', 'general'], default: 'general', required: true },
    isPublished: { type: Boolean, default: true, required: true, index: true },
  },
  {
    timestamps: true,
    collection: 'galleries',
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

export const Gallery = mongoose.models.Gallery || mongoose.model<IGalleryDocument>('Gallery', GallerySchema);

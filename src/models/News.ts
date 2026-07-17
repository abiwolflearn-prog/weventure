import mongoose, { Schema, Document } from 'mongoose';

export interface INewsDocument extends Document {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  content: string;
  category: 'Latest News' | 'Announcements' | 'Blog Articles' | 'Startup Stories' | 'Community News' | 'Innovation Updates';
  imageUrl?: string;
  tags: string[];
  isPublished: boolean;
  author: string;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const NewsSchema = new Schema<INewsDocument>(
  {
    tenantId: { type: String, required: true, default: 'weventurehub', index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: ['Latest News', 'Announcements', 'Blog Articles', 'Startup Stories', 'Community News', 'Innovation Updates'],
      default: 'Latest News',
      required: true,
      index: true,
    },
    imageUrl: { type: String },
    tags: [{ type: String, index: true }],
    isPublished: { type: Boolean, default: true, required: true, index: true },
    author: { type: String, default: 'WeVentureHub Editorial' },
    views: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: 'news',
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

export const News = mongoose.models.News || mongoose.model<INewsDocument>('News', NewsSchema);

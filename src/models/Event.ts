import mongoose, { Schema, Document } from 'mongoose';
import { EventStatus, EventVisibility } from '../types';

export interface IEventDocument extends Document {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  description: string;
  status: EventStatus;
  visibility: EventVisibility;
  category: string;
  tags: string[];
  schedule: {
    startDate: Date;
    endDate: Date;
    timezone: string;
  };
  capacity: {
    maxCapacity: number;
    activeRegistrations: number;
    isUnlimited: boolean;
  };
  registrationSettings: {
    registrationOpenDate?: Date;
    registrationCloseDate?: Date;
    requiresApproval: boolean;
    isInviteOnly?: boolean;
    customFormFields?: any[];
  };
  sessions: {
    _id?: any;
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    location?: string;
  }[];
  media: {
    bannerUrl?: string;
    imageUrls: string[];
    videoUrl?: string;
  };
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords: string[];
  };
  template?: string;
  modules?: {
    id: string;
    enabled: boolean;
    config: any;
  }[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventSessionSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  location: { type: String },
});

const EventSchema = new Schema<IEventDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(EventStatus),
      default: EventStatus.DRAFT,
      required: true,
      index: true,
    },
    visibility: {
      type: String,
      enum: Object.values(EventVisibility),
      default: EventVisibility.PUBLIC,
      required: true,
      index: true,
    },
    category: { type: String, required: true, index: true },
    tags: [{ type: String, index: true }],
    schedule: {
      startDate: { type: Date, required: true, index: true },
      endDate: { type: Date, required: true },
      timezone: { type: String, default: 'UTC', required: true },
    },
    capacity: {
      maxCapacity: { type: Number, required: true, default: 0 },
      activeRegistrations: { type: Number, default: 0 },
      isUnlimited: { type: Boolean, required: true, default: false },
    },
    registrationSettings: {
      registrationOpenDate: { type: Date },
      registrationCloseDate: { type: Date },
      requiresApproval: { type: Boolean, default: false, required: true },
      isInviteOnly: { type: Boolean, default: false },
      customFormFields: [
        {
          id: { type: String, required: true },
          label: { type: String, required: true },
          type: { type: String, enum: ['text', 'number', 'email', 'checkbox', 'select', 'file'], required: true },
          required: { type: Boolean, default: false },
          options: [{ type: String }],
          conditionalShow: {
            fieldId: { type: String },
            value: { type: String },
          },
        },
      ],
    },
    sessions: [EventSessionSchema],
    media: {
      bannerUrl: { type: String },
      imageUrls: [{ type: String }],
      videoUrl: { type: String },
    },
    seo: {
      metaTitle: { type: String },
      metaDescription: { type: String },
      metaKeywords: [{ type: String }],
    },
    template: { type: String, default: 'default' },
    modules: [
      {
        id: { type: String, required: true },
        enabled: { type: Boolean, default: false },
        config: { type: Schema.Types.Mixed, default: {} },
      }
    ],
    createdBy: { type: String, required: true },
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

// Compounded index: Unique slug per tenant to isolate workspaces and search pathways
EventSchema.index({ tenantId: 1, slug: 1 }, { unique: true });

// Text index to enable full text search on Title, Category and Tags
EventSchema.index(
  {
    title: 'text',
    category: 'text',
    tags: 'text',
    description: 'text',
  },
  {
    weights: {
      title: 10,
      category: 5,
      tags: 3,
      description: 1,
    },
    name: 'EventTextSearchIndex',
  }
);

export const Event = mongoose.model<IEventDocument>('Event', EventSchema);

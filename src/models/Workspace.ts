import mongoose, { Schema, Document } from 'mongoose';

export interface IBillingPlan {
  id: string;
  name: 'Hourly' | 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
  price: number;
  currency: string;
  deposit?: number;
  paymentDueDay?: number;
  agreementTemplate?: string;
  minimumDuration?: number;
  maximumDuration?: number;
  vat?: number;
  discount?: number;
  gracePeriod?: number;
  lateFee?: number;
  isActive: boolean;
}

export interface IWorkspaceDocument extends Document {
  id: string;
  tenantId: string;
  title: string;
  name: string;
  slug: string;
  shortDescription?: string;
  fullDescription?: string;
  category: string;
  workspaceType: string;
  type: 'HOT_DESK' | 'DEDICATED_DESK' | 'PRIVATE_OFFICE' | 'MEETING_ROOM' | 'CONFERENCE_ROOM' | 'EVENT_VENUE' | 'PODCAST_STUDIO' | 'TRAINING_ROOM' | 'CREATIVE_SPACE';
  capacity: number;
  floor?: string;
  size?: string;
  hourlyPrice: number;
  hourlyRate: number;
  dailyPrice?: number;
  dailyRate?: number;
  weeklyPrice?: number;
  monthlyPrice?: number;
  currency: string;
  coverImage?: string;
  imageUrl?: string;
  galleryImages: string[];
  amenities: string[];
  features: string[];
  availability: 'Available' | 'Occupied' | 'Maintenance' | 'Reserved' | 'Coming Soon';
  isAvailable: boolean;
  openingHours: string;
  closingHours: string;
  location?: string;
  mapLocation?: string;
  status: 'published' | 'draft' | 'archived';
  featured: boolean;
  displayOrder: number;
  rating: number;
  totalReviews: number;
  createdBy?: string;
  updatedBy?: string;
  packagePricing?: { name: string; hours: number; price: number }[];
  dynamicPricingRules?: {
    ruleName: string;
    type: 'weekend' | 'peak_hour' | 'seasonal';
    modifierType: 'percentage' | 'fixed';
    modifierValue: number;
    startHour?: number;
    endHour?: number;
    startMonth?: number;
    endMonth?: number;
  }[];
  billingPlans?: IBillingPlan[];
  availabilityRules: {
    startHour: number;
    endHour: number;
    allowedDays: number[];
  };
  bufferTime: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspaceDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    title: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, index: true },
    shortDescription: { type: String, default: '' },
    fullDescription: { type: String, default: '' },
    category: { type: String, default: 'Meeting Room', index: true },
    workspaceType: { type: String, default: 'MEETING_ROOM', index: true },
    type: {
      type: String,
      default: 'MEETING_ROOM',
      index: true,
    },
    capacity: { type: Number, required: true, min: 1 },
    floor: { type: String, default: 'Floor 1' },
    size: { type: String, default: '350 sq ft' },
    hourlyPrice: { type: Number, required: true, min: 0 },
    hourlyRate: { type: Number, required: true, min: 0 },
    dailyPrice: { type: Number, min: 0, default: 0 },
    dailyRate: { type: Number, min: 0, default: 0 },
    weeklyPrice: { type: Number, min: 0, default: 0 },
    monthlyPrice: { type: Number, min: 0, default: 0 },
    currency: { type: String, default: 'USD', required: true },
    coverImage: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    galleryImages: [{ type: String }],
    amenities: [{ type: String }],
    features: [{ type: String }],
    availability: {
      type: String,
      enum: ['Available', 'Occupied', 'Maintenance', 'Reserved', 'Coming Soon'],
      default: 'Available',
    },
    isAvailable: { type: Boolean, default: true, required: true },
    openingHours: { type: String, default: '08:00' },
    closingHours: { type: String, default: '20:00' },
    location: { type: String, default: 'WeVentureHub Main Campus' },
    mapLocation: { type: String, default: '' },
    status: {
      type: String,
      enum: ['published', 'draft', 'archived'],
      default: 'published',
      index: true,
    },
    featured: { type: Boolean, default: false, index: true },
    displayOrder: { type: Number, default: 0, index: true },
    rating: { type: Number, default: 5.0 },
    totalReviews: { type: Number, default: 0 },
    createdBy: { type: String },
    updatedBy: { type: String },
    packagePricing: [
      {
        name: { type: String, required: true },
        hours: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
      }
    ],
    dynamicPricingRules: [
      {
        ruleName: { type: String, required: true },
        type: { type: String, enum: ['weekend', 'peak_hour', 'seasonal'], required: true },
        modifierType: { type: String, enum: ['percentage', 'fixed'], required: true },
        modifierValue: { type: Number, required: true },
        startHour: { type: Number },
        endHour: { type: Number },
        startMonth: { type: Number },
        endMonth: { type: Number },
      }
    ],
    billingPlans: [
      {
        name: { type: String, enum: ['Hourly', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'], required: true },
        price: { type: Number, required: true, min: 0 },
        currency: { type: String, required: true, default: 'USD' },
        deposit: { type: Number, min: 0 },
        paymentDueDay: { type: Number, min: 1, max: 31 },
        agreementTemplate: { type: String },
        minimumDuration: { type: Number, min: 1 },
        maximumDuration: { type: Number, min: 1 },
        vat: { type: Number, min: 0, default: 0 },
        discount: { type: Number, min: 0, default: 0 },
        gracePeriod: { type: Number, min: 0, default: 0 },
        lateFee: { type: Number, min: 0, default: 0 },
        isActive: { type: Boolean, default: true, required: true },
      }
    ],
    availabilityRules: {
      startHour: { type: Number, default: 0, required: true },
      endHour: { type: Number, default: 24, required: true },
      allowedDays: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6], required: true },
    },
    bufferTime: { type: Number, default: 0, required: true },
    isDeleted: { type: Boolean, default: false, required: true, index: true },
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

// Pre-save middleware to keep fields synchronized
WorkspaceSchema.pre('save', function (this: any) {
  // Sync title and name
  if (this.title && !this.name) this.name = this.title;
  if (this.name && !this.title) this.title = this.name;

  // Generate slug if not set
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  // Sync hourly rates
  if (this.hourlyPrice !== undefined) this.hourlyRate = this.hourlyPrice;
  if (this.hourlyRate !== undefined) this.hourlyPrice = this.hourlyRate;

  // Sync daily rates
  if (this.dailyPrice !== undefined) this.dailyRate = this.dailyPrice;
  if (this.dailyRate !== undefined) this.dailyPrice = this.dailyRate;

  // Sync images
  if (this.coverImage && !this.imageUrl) this.imageUrl = this.coverImage;
  if (this.imageUrl && !this.coverImage) this.coverImage = this.imageUrl;

  // Sync availability & isAvailable
  if (this.availability) {
    this.isAvailable = this.availability === 'Available';
  } else {
    this.availability = this.isAvailable ? 'Available' : 'Occupied';
  }

  // Sync type / workspaceType
  if (this.workspaceType && !this.type) {
    const validEnums = ['HOT_DESK', 'DEDICATED_DESK', 'PRIVATE_OFFICE', 'MEETING_ROOM', 'CONFERENCE_ROOM', 'EVENT_VENUE', 'PODCAST_STUDIO', 'TRAINING_ROOM', 'CREATIVE_SPACE'];
    if (validEnums.includes(this.workspaceType)) {
      this.type = this.workspaceType as any;
    }
  } else if (this.type && !this.workspaceType) {
    this.workspaceType = this.type;
  }
});

// Compounded index for name searching and multi-tenant performance
WorkspaceSchema.index({ tenantId: 1, isDeleted: 1, name: 1 });

export const Workspace = mongoose.model<IWorkspaceDocument>('Workspace', WorkspaceSchema);

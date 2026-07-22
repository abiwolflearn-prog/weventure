import mongoose, { Schema, Document } from 'mongoose';

export interface IStartupProgramDocument extends Document {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  duration: string;
  cohortSize: number;
  icon: string;
  benefits: string[];
  eligibility: string;
  status: 'active' | 'upcoming' | 'closed';
  ctaText: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const StartupProgramSchema = new Schema<IStartupProgramDocument>(
  {
    tenantId: { type: String, required: true, default: 'weventurehub', index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, index: true },
    category: { type: String, required: true, default: 'Incubation' },
    shortDescription: { type: String, required: true },
    fullDescription: { type: String, default: '' },
    duration: { type: String, default: '12 Weeks' },
    cohortSize: { type: Number, default: 15 },
    icon: { type: String, default: 'Rocket' },
    benefits: { type: [String], default: [] },
    eligibility: { type: String, default: 'Open to all early-stage & tech founders' },
    status: { type: String, enum: ['active', 'upcoming', 'closed'], default: 'active', index: true },
    ctaText: { type: String, default: 'Apply Now' },
    sortOrder: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: 'startup_programs',
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

export const StartupProgram =
  mongoose.models.StartupProgram ||
  mongoose.model<IStartupProgramDocument>('StartupProgram', StartupProgramSchema);

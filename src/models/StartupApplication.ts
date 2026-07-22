import mongoose, { Schema, Document } from 'mongoose';

export interface IStartupApplicationDocument extends Document {
  id: string;
  tenantId: string;
  programId?: string;
  programTitle?: string;
  startupName: string;
  founderName: string;
  email: string;
  phone: string;
  industry: string;
  startupStage: string;
  teamSize: string;
  website?: string;
  linkedIn?: string;
  briefDescription: string;
  currentChallenges?: string;
  fundingStatus?: string;
  status: 'pending' | 'under_review' | 'interview_scheduled' | 'approved' | 'rejected';
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StartupApplicationSchema = new Schema<IStartupApplicationDocument>(
  {
    tenantId: { type: String, required: true, default: 'weventurehub', index: true },
    programId: { type: String },
    programTitle: { type: String, default: 'General Incubator Application' },
    startupName: { type: String, required: true, trim: true },
    founderName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    phone: { type: String, required: true, trim: true },
    industry: { type: String, required: true, default: 'Fintech' },
    startupStage: { type: String, required: true, default: 'MVP Built' },
    teamSize: { type: String, required: true, default: '1-3 members' },
    website: { type: String, trim: true },
    linkedIn: { type: String, trim: true },
    briefDescription: { type: String, required: true },
    currentChallenges: { type: String, default: '' },
    fundingStatus: { type: String, default: 'Bootstrapped' },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'interview_scheduled', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewNotes: { type: String, default: '' },
  },
  {
    timestamps: true,
    collection: 'startup_applications',
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

export const StartupApplication =
  mongoose.models.StartupApplication ||
  mongoose.model<IStartupApplicationDocument>('StartupApplication', StartupApplicationSchema);

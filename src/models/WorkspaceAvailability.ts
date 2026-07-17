import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkspaceAvailabilityDocument extends Document {
  id: string;
  tenantId: string;
  workspaceId: string;
  date: Date;
  status: 'Available' | 'Booked' | 'Reserved' | 'Maintenance' | 'Closed';
  slots: {
    startHour: number;
    endHour: number;
    status: 'Available' | 'Booked' | 'Reserved' | 'Maintenance' | 'Closed';
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceAvailabilitySchema = new Schema<IWorkspaceAvailabilityDocument>(
  {
    tenantId: { type: String, required: true, default: 'weventurehub', index: true },
    workspaceId: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['Available', 'Booked', 'Reserved', 'Maintenance', 'Closed'],
      default: 'Available',
      required: true,
    },
    slots: [
      {
        startHour: { type: Number, required: true },
        endHour: { type: Number, required: true },
        status: {
          type: String,
          enum: ['Available', 'Booked', 'Reserved', 'Maintenance', 'Closed'],
          default: 'Available',
        }
      }
    ]
  },
  {
    timestamps: true,
    collection: 'workspaceAvailability',
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

export const WorkspaceAvailability = mongoose.models.WorkspaceAvailability || mongoose.model<IWorkspaceAvailabilityDocument>('WorkspaceAvailability', WorkspaceAvailabilitySchema);

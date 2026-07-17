import mongoose, { Schema, Document } from 'mongoose';
import { RegistrationStatus } from '../types';

export interface IRegistrationDocument extends Document {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  eventId: string;
  orderId?: string;
  ticketTypeId?: string;
  ticketNumber: string;
  qrCode: string;
  attendeeName: string;
  attendeeEmail: string;
  status: RegistrationStatus;
  checkedIn: boolean;
  checkedInAt?: Date;
  registrationDate: Date;
  customAnswers?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const RegistrationSchema = new Schema<IRegistrationDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true, index: true },
    eventId: { type: String, required: true, index: true },
    orderId: { type: String },
    ticketTypeId: { type: String },
    ticketNumber: { type: String, required: true, unique: true, index: true },
    qrCode: { type: String, required: true },
    attendeeName: { type: String, required: true, trim: true },
    attendeeEmail: { type: String, required: true, index: true, trim: true },
    status: {
      type: String,
      enum: Object.values(RegistrationStatus),
      default: RegistrationStatus.CONFIRMED,
      required: true,
      index: true,
    },
    checkedIn: { type: Boolean, required: true, default: false },
    checkedInAt: { type: Date },
    registrationDate: { type: Date, default: Date.now, required: true },
    customAnswers: { type: Map, of: Schema.Types.Mixed },
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

RegistrationSchema.index({ tenantId: 1, eventId: 1 });
RegistrationSchema.index({ tenantId: 1, userEmail: 1 });

export const Registration = mongoose.model<IRegistrationDocument>('Registration', RegistrationSchema);

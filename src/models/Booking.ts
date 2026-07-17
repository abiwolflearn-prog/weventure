import mongoose, { Schema, Document } from 'mongoose';

export interface IBookingDocument extends Document {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  spaceId: string;
  startTime: Date;
  endTime: Date;
  totalAmount: number;
  status: 'PENDING_APPROVAL' | 'CONFIRMED' | 'CANCELLED';
  purpose?: string;
  qrCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBookingDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true, index: true },
    spaceId: { type: String, required: true, index: true },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true, index: true },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['PENDING_APPROVAL', 'CONFIRMED', 'CANCELLED'],
      default: 'CONFIRMED',
      required: true,
      index: true,
    },
    purpose: { type: String, trim: true },
    qrCode: { type: String, required: true },
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

// Compounded index to enforce multi-tenant isolation and ease timeline operations
BookingSchema.index({ tenantId: 1, spaceId: 1, startTime: 1, endTime: 1 });
BookingSchema.index({ tenantId: 1, userId: 1, status: 1 });

export const Booking = mongoose.model<IBookingDocument>('Booking', BookingSchema);

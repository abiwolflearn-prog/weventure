import mongoose, { Schema, Document } from 'mongoose';
import { TicketStatus, TicketVisibility } from '../types';

export interface ITicketTypeDocument extends Document {
  id: string;
  tenantId: string;
  eventId: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  capacity: {
    maxQuantity: number;
    soldQuantity: number;
    isUnlimited: boolean;
  };
  availability: {
    salesStart?: Date;
    salesEnd?: Date;
  };
  settings: {
    minOrderQty: number;
    maxOrderQty: number;
    visibility: TicketVisibility;
  };
  status: TicketStatus;
  createdAt: Date;
  updatedAt: Date;
}

const TicketTypeSchema = new Schema<ITicketTypeDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    eventId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0, default: 0 },
    currency: { type: String, required: true, default: 'USD' },
    capacity: {
      maxQuantity: { type: Number, required: true, default: 0 },
      soldQuantity: { type: Number, required: true, default: 0 },
      isUnlimited: { type: Boolean, required: true, default: false },
    },
    availability: {
      salesStart: { type: Date },
      salesEnd: { type: Date },
    },
    settings: {
      minOrderQty: { type: Number, required: true, default: 1, min: 1 },
      maxOrderQty: { type: Number, required: true, default: 10, min: 1 },
      visibility: {
        type: String,
        enum: Object.values(TicketVisibility),
        default: TicketVisibility.PUBLIC,
        required: true,
      },
    },
    status: {
      type: String,
      enum: Object.values(TicketStatus),
      default: TicketStatus.ACTIVE,
      required: true,
      index: true,
    },
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

TicketTypeSchema.index({ tenantId: 1, eventId: 1 });

export const TicketType = mongoose.model<ITicketTypeDocument>('TicketType', TicketTypeSchema);

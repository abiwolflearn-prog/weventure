import mongoose, { Schema, Document } from 'mongoose';
import { OrderStatus, OrderType } from '../types';

export interface IOrderDocument extends Document {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  orderType: OrderType;
  eventId?: string;
  itemId?: string;
  tickets: {
    ticketTypeId: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  status: OrderStatus;
  paymentDetails?: {
    method?: string;
    reference?: string;
  };
  orderDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrderDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true, index: true },
    orderType: {
      type: String,
      enum: Object.values(OrderType),
      default: OrderType.EVENT_TICKET,
      required: true,
      index: true,
    },
    eventId: { type: String, index: true },
    itemId: { type: String, index: true },
    tickets: [
      {
        ticketTypeId: { type: String, required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.COMPLETED, // Automatically completed because we aren't doing payment integration yet
      required: true,
      index: true,
    },
    paymentDetails: {
      method: { type: String },
      reference: { type: String },
    },
    orderDate: { type: Date, default: Date.now, required: true },
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

export const Order = mongoose.model<IOrderDocument>('Order', OrderSchema);

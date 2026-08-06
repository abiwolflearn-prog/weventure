import mongoose, { Schema, Document } from 'mongoose';

export interface IExpenseDocument extends Document {
  id: string;
  category: string;
  name: string;
  description?: string;
  vendor: string;
  amount: number;
  currency: string;
  date: Date;
  paymentMethod: string;
  status: 'Pending' | 'Approved' | 'Paid';
  referenceNumber?: string;
  receiptUrl?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  createdByDetails?: {
    name: string;
    email: string;
  };
}

const ExpenseSchema = new Schema<IExpenseDocument>(
  {
    category: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    vendor: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'USD' },
    date: { type: Date, required: true },
    paymentMethod: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Paid'], default: 'Pending' },
    referenceNumber: { type: String },
    receiptUrl: { type: String },
    notes: { type: String },
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

export const Expense = mongoose.model<IExpenseDocument>('Expense', ExpenseSchema);

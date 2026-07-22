import mongoose, { Schema, Document } from 'mongoose';

export interface ISupportTicketDocument extends Document {
  id: string;
  tenantId: string;
  ticketNumber: string;
  conversationId?: string;
  userId?: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  subject: string;
  category: 'workspace' | 'event' | 'membership' | 'billing' | 'technical' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  messages: {
    sender: 'user' | 'admin' | 'system';
    senderName: string;
    text: string;
    timestamp: Date;
  }[];
  assignedTo?: string;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicketDocument>(
  {
    tenantId: { type: String, required: true, default: 'weventurehub', index: true },
    ticketNumber: { type: String, required: true, unique: true },
    conversationId: { type: String, index: true },
    userId: { type: String, index: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    userPhone: { type: String },
    subject: { type: String, required: true },
    category: {
      type: String,
      enum: ['workspace', 'event', 'membership', 'billing', 'technical', 'general'],
      default: 'general',
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open', index: true },
    messages: [
      {
        sender: { type: String, enum: ['user', 'admin', 'system'], required: true },
        senderName: { type: String, required: true },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    assignedTo: { type: String },
    resolutionNotes: { type: String },
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
  }
);

export const SupportTicket = mongoose.model<ISupportTicketDocument>('SupportTicket', SupportTicketSchema);

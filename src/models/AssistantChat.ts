import mongoose, { Schema, Document } from 'mongoose';

export interface IAssistantMessage {
  id?: string;
  sender: 'user' | 'assistant' | 'system' | 'agent';
  text: string;
  language?: 'en' | 'am' | 'om';
  timestamp: Date;
  actions?: {
    type: 'BOOK_WORKSPACE' | 'REGISTER_EVENT' | 'VIEW_INVOICE' | 'SUPPORT_TICKET' | 'RECOMMENDATION' | 'PAYMENT_HELP';
    label?: string;
    payload?: any;
  }[];
  ragGrounding?: {
    sourceTypes: string[];
    foundCount: number;
  };
  feedback?: {
    rating: 'thumbs_up' | 'thumbs_down';
    comment?: string;
  };
}

export interface IAssistantConversationDocument extends Document {
  id: string;
  tenantId: string;
  sessionId: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  language: 'en' | 'am' | 'om';
  status: 'active' | 'resolved' | 'handed_off';
  messages: IAssistantMessage[];
  supportTicketId?: string;
  topics?: string[];
  satisfactionRating?: number; // 1-5
  totalMessages: number;
  aiHandledCount: number;
  avgResponseTimeMs?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AssistantMessageSchema = new Schema({
  sender: { type: String, enum: ['user', 'assistant', 'system', 'agent'], required: true },
  text: { type: String, required: true },
  language: { type: String, enum: ['en', 'am', 'om'], default: 'en' },
  timestamp: { type: Date, default: Date.now },
  actions: [{ type: Schema.Types.Mixed }],
  ragGrounding: {
    sourceTypes: [{ type: String }],
    foundCount: { type: Number, default: 0 },
  },
  feedback: {
    rating: { type: String, enum: ['thumbs_up', 'thumbs_down'] },
    comment: { type: String },
  },
});

const AssistantConversationSchema = new Schema<IAssistantConversationDocument>(
  {
    tenantId: { type: String, required: true, default: 'weventurehub', index: true },
    sessionId: { type: String, required: true, index: true },
    userId: { type: String, index: true },
    userEmail: { type: String },
    userName: { type: String },
    userRole: { type: String },
    language: { type: String, enum: ['en', 'am', 'om'], default: 'en' },
    status: { type: String, enum: ['active', 'resolved', 'handed_off'], default: 'active', index: true },
    messages: [AssistantMessageSchema],
    supportTicketId: { type: String, index: true },
    topics: [{ type: String }],
    satisfactionRating: { type: Number, min: 1, max: 5 },
    totalMessages: { type: Number, default: 0 },
    aiHandledCount: { type: Number, default: 0 },
    avgResponseTimeMs: { type: Number, default: 0 },
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

export const AssistantConversation = mongoose.model<IAssistantConversationDocument>(
  'AssistantConversation',
  AssistantConversationSchema
);

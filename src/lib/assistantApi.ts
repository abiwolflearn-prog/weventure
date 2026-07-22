import { axiosInstance } from './axiosInstance';

export interface IAssistantMessage {
  id?: string;
  sender: 'user' | 'assistant' | 'system' | 'agent';
  text: string;
  language?: 'en' | 'am' | 'om';
  timestamp: string | Date;
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

export const assistantApi = {
  async sendMessage(sessionId: string, message: string, language: 'en' | 'am' | 'om' = 'en') {
    const res = await axiosInstance.post('/assistant/chat', {
      sessionId,
      message,
      language,
    });
    return res.data.data;
  },

  async getHistory(sessionId?: string) {
    const res = await axiosInstance.get('/assistant/history', {
      params: { sessionId },
    });
    return res.data.data;
  },

  async createSupportTicket(data: {
    sessionId?: string;
    name?: string;
    email: string;
    phone?: string;
    subject: string;
    category?: string;
    priority?: string;
    message: string;
  }) {
    const res = await axiosInstance.post('/assistant/ticket', data);
    return res.data.data;
  },

  async getAnalytics() {
    const res = await axiosInstance.get('/assistant/analytics');
    return res.data.data;
  },

  async getTickets() {
    const res = await axiosInstance.get('/assistant/tickets');
    return res.data.data;
  },

  async replyTicket(id: string, message: string, status?: string) {
    const res = await axiosInstance.post(`/assistant/tickets/${id}/reply`, {
      message,
      status,
    });
    return res.data.data;
  },

  async submitFeedback(sessionId: string, rating: number, comment?: string) {
    const res = await axiosInstance.post('/assistant/feedback', {
      sessionId,
      rating,
      comment,
    });
    return res.data.data;
  },
};

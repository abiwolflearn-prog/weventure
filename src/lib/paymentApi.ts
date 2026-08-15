import { axiosInstance } from './axiosInstance';

export interface CreatePaymentPayload {
  amount: number;
  currency?: string;
  provider: 'ARIFPAY' | 'CHAPA' | 'STRIPE' | 'PAYPAL' | 'FLUTTERWAVE' | 'PAYSTACK' | 'TELEBIRR' | 'MANUAL';
  targetType: 'ORDER' | 'BOOKING' | 'INVOICE';
  targetId: string;
  firstName?: string;
  lastName?: string;
  billingDetails?: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    address?: string;
    taxId?: string;
  };
  promoCode?: string;
}

export const paymentApi = {
  createPayment: async (payload: CreatePaymentPayload) => {
    const response = await axiosInstance.post('/payments', payload);
    return response.data.data;
  },

  verifyPayment: async (txRef: string) => {
    const response = await axiosInstance.get(`/payments/verify/${txRef}`);
    return response.data.data;
  },

  getTransactions: async () => {
    const response = await axiosInstance.get('/payments/transactions');
    return response.data.data;
  },

  getInvoices: async (params?: Record<string, any>) => {
    const response = await axiosInstance.get('/payments/invoices', { params });
    return response.data.data;
  },

  createInvoice: async (payload: any) => {
    const response = await axiosInstance.post('/payments/invoices', payload);
    return response.data.data;
  },

  updateInvoice: async (id: string, payload: any) => {
    const response = await axiosInstance.put(`/payments/invoices/${id}`, payload);
    return response.data.data;
  },

  deleteInvoice: async (id: string) => {
    const response = await axiosInstance.delete(`/payments/invoices/${id}`);
    return response.data.data;
  },

  emailInvoice: async (id: string, recipient?: string, emailType?: string, message?: string) => {
    const response = await axiosInstance.post(`/payments/invoices/${id}/email`, { recipient, emailType, message });
    return response.data.data;
  },

  recordPayment: async (id: string, paymentData: { amount: number; paymentMethod: string; referenceNumber?: string; notes?: string }) => {
    const response = await axiosInstance.post(`/payments/invoices/${id}/payments`, paymentData);
    return response.data.data;
  },

  getInvoiceStats: async () => {
    const response = await axiosInstance.get('/payments/invoices/stats');
    return response.data.data;
  },

  updateInvoiceStatus: async (id: string, status: string) => {
    const response = await axiosInstance.patch(`/payments/invoices/${id}/status`, { status });
    return response.data.data;
  },

  getInvoiceById: async (id: string) => {
    const response = await axiosInstance.get(`/payments/invoices/${id}`);
    return response.data.data;
  },

  requestRefund: async (payload: { paymentId: string; amount: number; reason: string }) => {
    const response = await axiosInstance.post('/payments/refunds', payload);
    return response.data.data;
  },

  getRefunds: async () => {
    const response = await axiosInstance.get('/payments/refunds');
    return response.data.data;
  },

  approveRefund: async (id: string) => {
    const response = await axiosInstance.post(`/payments/refunds/${id}/approve`);
    return response.data.data;
  },

  rejectRefund: async (id: string) => {
    const response = await axiosInstance.post(`/payments/refunds/${id}/reject`);
    return response.data.data;
  },

  getRevenueStats: async () => {
    const response = await axiosInstance.get('/payments/stats');
    return response.data.data;
  },

  validatePromoCode: async (code: string, subtotal: number) => {
    const response = await axiosInstance.post('/payments/promo/validate', { code, subtotal });
    return response.data.data;
  },

  createPromoCode: async (payload: {
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    maxUses?: number;
    expiryDate?: string;
  }) => {
    const response = await axiosInstance.post('/payments/promo', payload);
    return response.data.data;
  },

  getPromoCodes: async () => {
    const response = await axiosInstance.get('/payments/promo');
    return response.data.data;
  },

  togglePromoCode: async (id: string, isActive: boolean) => {
    const response = await axiosInstance.patch(`/payments/promo/${id}/toggle`, { isActive });
    return response.data.data;
  },

  getArifPayConfig: async () => {
    const response = await axiosInstance.get('/payments/config/arifpay');
    return response.data.data;
  },

  saveArifPayConfig: async (payload: { settings: Record<string, boolean>; enabled: boolean }) => {
    const response = await axiosInstance.post('/payments/config/arifpay', payload);
    return response.data.data;
  },
};

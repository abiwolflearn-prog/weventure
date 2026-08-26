import { axiosInstance } from './axiosInstance';

export interface IQuotationItem {
  serviceId?: string;
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface IQuotation {
  id: string;
  _id?: string;
  tenantId: string;
  quotationNumber: string;
  customerId?: string;
  userId?: string;
  customerName: string;
  companyName?: string;
  tinNumber?: string;
  email: string;
  phone?: string;
  address?: string;
  quotationDate: string;
  validUntil?: string;
  preparedBy: string;
  salespersonEmail?: string;
  currency: 'USD' | 'ETB';
  exchangeRate: number;
  items: IQuotationItem[];
  subtotal: number;
  vat: number;
  discount: number;
  grandTotal: number;
  convertedEtbTotal: number;
  amountInWords?: string;
  amenities: string[];
  selectedBanks: string[];
  bankDetails?: string;
  notes?: string;
  paymentTerms?: string;
  status: 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Rejected' | 'Expired' | 'Converted to Invoice';
  convertedInvoiceId?: string;
  convertedInvoiceNumber?: string;
  history?: Array<{
    action: string;
    performedBy: string;
    timestamp: string;
    note?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface IQuotationStats {
  totalQuotations: number;
  draft: number;
  sent: number;
  viewed: number;
  accepted: number;
  rejected: number;
  expired: number;
  converted: number;
  conversionRate: number;
  totalValueUsd: number;
  totalValueEtb: number;
  acceptedValueUsd: number;
  acceptedValueEtb: number;
}

export interface ISettlementBank {
  id?: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  swiftCode?: string;
  isActive?: boolean;
}

export const quotationApi = {
  getQuotations: async (params: Record<string, any> = {}) => {
    const res = await axiosInstance.get('/quotations', { params });
    return res.data;
  },

  getQuotationStats: async () => {
    const res = await axiosInstance.get('/quotations/stats');
    return res.data?.data;
  },

  getQuotationById: async (id: string) => {
    const res = await axiosInstance.get(`/quotations/${id}`);
    return res.data?.data;
  },

  getNextNumber: async () => {
    const res = await axiosInstance.get('/quotations/next-number');
    return res.data?.data?.nextNumber;
  },

  createQuotation: async (payload: Partial<IQuotation>) => {
    const res = await axiosInstance.post('/quotations', payload);
    return res.data?.data;
  },

  updateQuotation: async (id: string, payload: Partial<IQuotation>) => {
    const res = await axiosInstance.put(`/quotations/${id}`, payload);
    return res.data?.data;
  },

  deleteQuotation: async (id: string) => {
    const res = await axiosInstance.delete(`/quotations/${id}`);
    return res.data;
  },

  duplicateQuotation: async (id: string) => {
    const res = await axiosInstance.post(`/quotations/${id}/duplicate`);
    return res.data?.data;
  },

  updateStatus: async (id: string, status: string) => {
    const res = await axiosInstance.patch(`/quotations/${id}/status`, { status });
    return res.data?.data;
  },

  convertToInvoice: async (id: string) => {
    const res = await axiosInstance.post(`/quotations/${id}/convert-to-invoice`);
    return res.data?.data;
  },

  sendEmail: async (id: string, recipientEmail?: string, customMessage?: string) => {
    const res = await axiosInstance.post(`/quotations/${id}/send`, {
      recipientEmail,
      customMessage,
    });
    return res.data;
  },

  getSettlementBanks: async (): Promise<ISettlementBank[]> => {
    const res = await axiosInstance.get('/quotations/banks');
    return res.data?.data || [];
  },

  saveSettlementBank: async (bank: Partial<ISettlementBank>) => {
    const res = await axiosInstance.post('/quotations/banks', bank);
    return res.data?.data;
  },

  deleteSettlementBank: async (bankName: string) => {
    const res = await axiosInstance.delete(`/quotations/banks/${encodeURIComponent(bankName)}`);
    return res.data;
  },

  downloadPdf: async (id: string, quotationNumber: string) => {
    const res = await axiosInstance.get(`/quotations/${id}/pdf`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Quotation-${quotationNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

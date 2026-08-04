import { axiosInstance } from './axiosInstance';

export interface IPricingRule {
  id?: string;
  _id?: string;
  resourceId?: string;
  resourceType: string;
  resourceName: string;
  pricingType?: string;
  billingCycle: string;
  minimumDuration: number;
  maximumDuration: number;
  basePrice: number;
  vatPercentage: number;
  totalPrice: number;
  currency: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  isActive: boolean;
}

export const pricingApi = {
  getRules: async () => {
    const response = await axiosInstance.get('/pricing');
    return response.data; // should return { success: true, data: IPricingRule[] }
  },

  getRuleById: async (id: string) => {
    const response = await axiosInstance.get(`/pricing/${id}`);
    return response.data.data;
  },

  createRule: async (payload: IPricingRule) => {
    const response = await axiosInstance.post('/pricing', payload);
    return response.data.data;
  },

  updateRule: async (id: string, payload: Partial<IPricingRule>) => {
    const response = await axiosInstance.put(`/pricing/${id}`, payload);
    return response.data.data;
  },

  deleteRule: async (id: string) => {
    const response = await axiosInstance.delete(`/pricing/${id}`);
    return response.data;
  },
};

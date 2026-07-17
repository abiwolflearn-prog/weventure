import { axiosInstance } from './axiosInstance';

export interface PlanLimits {
  maxWorkspaces: number;
  maxEvents: number;
  maxUsers: number;
  maxStorageMB: number;
  maxApiRequests: number;
}

export interface PlanPayload {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  limits: PlanLimits;
  featureFlags: Record<string, boolean>;
  isCustom?: boolean;
  tenantId?: string;
}

export const billingApi = {
  getPlans: async () => {
    const response = await axiosInstance.get('/billing/plans');
    return response.data.data;
  },

  getFeatures: async () => {
    const response = await axiosInstance.get('/billing/features');
    return response.data.data;
  },

  getBillingDashboard: async () => {
    const response = await axiosInstance.get('/billing/dashboard');
    return response.data.data;
  },

  subscribe: async (planId: string, billingInterval: 'monthly' | 'yearly') => {
    const response = await axiosInstance.post('/billing/subscribe', { planId, billingInterval });
    return response.data.data;
  },

  cancelSubscription: async () => {
    const response = await axiosInstance.post('/billing/cancel');
    return response.data.data;
  },

  renewSubscription: async () => {
    const response = await axiosInstance.post('/billing/renew');
    return response.data.data;
  },

  getBillingHistory: async () => {
    const response = await axiosInstance.get('/billing/history');
    return response.data.data;
  },

  createPlan: async (payload: PlanPayload) => {
    const response = await axiosInstance.post('/billing/plans', payload);
    return response.data.data;
  },

  updatePlan: async (planId: string, payload: Partial<PlanPayload>) => {
    const response = await axiosInstance.put(`/billing/plans/${planId}`, payload);
    return response.data.data;
  },

  deletePlan: async (planId: string) => {
    const response = await axiosInstance.delete(`/billing/plans/${planId}`);
    return response.data.data;
  },

  updateFeatureOverrides: async (tenantId: string, overrides: Record<string, boolean>) => {
    const response = await axiosInstance.post(`/billing/tenants/${tenantId}/overrides`, { overrides });
    return response.data.data;
  },
};

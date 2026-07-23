import { axiosInstance } from './axiosInstance';

export interface IBillingPlan {
  id?: string;
  _id?: string;
  name: 'Hourly' | 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
  price: number;
  currency: string;
  deposit?: number;
  paymentDueDay?: number;
  agreementTemplate?: string;
  isActive: boolean;
}

export interface IWorkspace {
  _id: string;
  id?: string;
  tenantId: string;
  title: string;
  name?: string;
  slug: string;
  shortDescription?: string;
  fullDescription?: string;
  category: string;
  workspaceType: string;
  type?: string;
  capacity: number;
  floor?: string;
  size?: string;
  hourlyPrice: number;
  hourlyRate?: number;
  dailyPrice: number;
  dailyRate?: number;
  weeklyPrice: number;
  monthlyPrice: number;
  currency: string;
  coverImage?: string;
  imageUrl?: string;
  galleryImages: string[];
  amenities: string[];
  features: string[];
  availability: 'Available' | 'Occupied' | 'Maintenance' | 'Reserved';
  isAvailable: boolean;
  openingHours?: string;
  closingHours?: string;
  location?: string;
  mapLocation?: string;
  status: 'published' | 'draft' | 'archived';
  featured: boolean;
  displayOrder: number;
  rating: number;
  totalReviews: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  availabilityRules?: {
    startHour: number;
    endHour: number;
    allowedDays: number[];
  };
  bufferTime?: number;
  billingPlans?: IBillingPlan[];
}

export interface IWorkspacePayload {
  title: string;
  name?: string;
  slug?: string;
  shortDescription?: string;
  fullDescription?: string;
  category: string;
  workspaceType: string;
  type?: string;
  capacity: number;
  floor?: string;
  size?: string;
  hourlyPrice: number;
  hourlyRate?: number;
  dailyPrice?: number;
  weeklyPrice?: number;
  monthlyPrice?: number;
  currency?: string;
  coverImage?: string;
  imageUrl?: string;
  galleryImages?: string[];
  amenities?: string[];
  features?: string[];
  availability?: 'Available' | 'Occupied' | 'Maintenance' | 'Reserved';
  isAvailable?: boolean;
  openingHours?: string;
  closingHours?: string;
  location?: string;
  mapLocation?: string;
  status?: 'published' | 'draft' | 'archived';
  featured?: boolean;
  displayOrder?: number;
  billingPlans?: IBillingPlan[];
}

export const workspaceApi = {
  getWorkspaces: async (params?: {
    search?: string;
    category?: string;
    workspaceType?: string;
    type?: string;
    isAvailable?: boolean;
    availability?: string;
    minCapacity?: number;
    maxPrice?: number;
    status?: string;
    featured?: boolean;
    sort?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await axiosInstance.get('/workspaces', { params });
    return response.data; // paginated structure: { success, data: [], pagination }
  },

  getWorkspaceById: async (id: string) => {
    const response = await axiosInstance.get(`/workspaces/${id}`);
    return response.data.data as IWorkspace;
  },

  createWorkspace: async (payload: IWorkspacePayload) => {
    const response = await axiosInstance.post('/workspaces', payload);
    return response.data.data as IWorkspace;
  },

  updateWorkspace: async (id: string, payload: Partial<IWorkspacePayload>) => {
    const response = await axiosInstance.put(`/workspaces/${id}`, payload);
    return response.data.data as IWorkspace;
  },

  updateWorkspaceStatus: async (id: string, status: 'published' | 'draft' | 'archived') => {
    const response = await axiosInstance.patch(`/workspaces/${id}/status`, { status });
    return response.data.data as IWorkspace;
  },

  toggleWorkspaceFeatured: async (id: string, featured: boolean) => {
    const response = await axiosInstance.patch(`/workspaces/${id}/feature`, { featured });
    return response.data.data as IWorkspace;
  },

  updateWorkspaceOrder: async (id: string, displayOrder: number) => {
    const response = await axiosInstance.patch(`/workspaces/${id}/order`, { displayOrder });
    return response.data.data as IWorkspace;
  },

  duplicateWorkspace: async (id: string) => {
    const response = await axiosInstance.post(`/workspaces/${id}/duplicate`);
    return response.data.data as IWorkspace;
  },

  deleteWorkspace: async (id: string) => {
    const response = await axiosInstance.delete(`/workspaces/${id}`);
    return response.data;
  },
};

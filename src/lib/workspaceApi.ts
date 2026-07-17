import { axiosInstance } from './axiosInstance';

export interface IWorkspacePayload {
  name: string;
  type: 'HOT_DESK' | 'MEETING_ROOM' | 'EVENT_VENUE';
  capacity: number;
  hourlyRate: number;
  currency?: string;
  amenities: string[];
  isAvailable?: boolean;
  availabilityRules?: {
    startHour: number;
    endHour: number;
    allowedDays: number[];
  };
  bufferTime?: number;
}

export const workspaceApi = {
  getWorkspaces: async (params?: {
    search?: string;
    type?: string;
    isAvailable?: boolean;
    minCapacity?: number;
  }) => {
    const response = await axiosInstance.get('/workspaces', { params });
    return response.data; // paginated structure: { success, data: [], pagination }
  },

  getWorkspaceById: async (id: string) => {
    const response = await axiosInstance.get(`/workspaces/${id}`);
    return response.data.data;
  },

  createWorkspace: async (payload: IWorkspacePayload) => {
    const response = await axiosInstance.post('/workspaces', payload);
    return response.data.data;
  },

  updateWorkspace: async (id: string, payload: Partial<IWorkspacePayload>) => {
    const response = await axiosInstance.put(`/workspaces/${id}`, payload);
    return response.data.data;
  },

  deleteWorkspace: async (id: string) => {
    const response = await axiosInstance.delete(`/workspaces/${id}`);
    return response.data;
  },
};

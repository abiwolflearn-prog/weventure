import { axiosInstance } from './axiosInstance';

export interface IBookingPayload {
  spaceId: string;
  startTime: string;
  endTime: string;
  purpose?: string;
}

export const bookingApi = {
  getBookings: async (params?: {
    spaceId?: string;
    userId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await axiosInstance.get('/bookings', { params });
    return response.data; // paginated structure: { success, data: [], pagination }
  },

  getBookingById: async (id: string) => {
    const response = await axiosInstance.get(`/bookings/${id}`);
    return response.data.data;
  },

  createBooking: async (payload: IBookingPayload) => {
    const response = await axiosInstance.post('/bookings', payload);
    return response.data.data;
  },

  cancelBooking: async (id: string) => {
    const response = await axiosInstance.post(`/bookings/${id}/cancel`);
    return response.data.data;
  },

  approveBooking: async (id: string) => {
    const response = await axiosInstance.post(`/bookings/${id}/approve`);
    return response.data.data;
  },

  rejectBooking: async (id: string) => {
    const response = await axiosInstance.post(`/bookings/${id}/reject`);
    return response.data.data;
  },

  getAgreement: async (bookingId: string) => {
    const response = await axiosInstance.get(`/bookings/${bookingId}/agreement`);
    return response.data.data;
  },

  generateAgreement: async (bookingId: string, payload: { rules?: any; terms: string; conditions: string }) => {
    const response = await axiosInstance.post(`/bookings/${bookingId}/generate-agreement`, payload);
    return response.data.data;
  },

  signAgreement: async (bookingId: string, customerName: string) => {
    const response = await axiosInstance.post(`/bookings/${bookingId}/sign-agreement`, { customerName });
    return response.data.data;
  },

  generateInvoice: async (bookingId: string) => {
    const response = await axiosInstance.post(`/bookings/${bookingId}/generate-invoice`);
    return response.data.data;
  },
};

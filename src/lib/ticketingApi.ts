import { axiosInstance } from './axiosInstance';
import { ITicketType, IOrder, IRegistration, IWaitlist } from '../types';

export const ticketingApi = {
  // Ticket Types
  getTicketTypes: async (eventId: string, admin: boolean = false): Promise<ITicketType[]> => {
    const response = await axiosInstance.get(`/ticketing/events/${eventId}/ticket-types`, {
      params: { admin },
    });
    return response.data.data;
  },

  createTicketType: async (data: Partial<ITicketType>): Promise<ITicketType> => {
    const response = await axiosInstance.post('/ticketing/ticket-types', data);
    return response.data.data;
  },

  updateTicketType: async (id: string, data: Partial<ITicketType>): Promise<ITicketType> => {
    const response = await axiosInstance.put(`/ticketing/ticket-types/${id}`, data);
    return response.data.data;
  },

  deleteTicketType: async (id: string): Promise<boolean> => {
    const response = await axiosInstance.delete(`/ticketing/ticket-types/${id}`);
    return response.data.success;
  },

  // Orders
  createOrder: async (data: {
    eventId: string;
    attendeeName?: string;
    attendeeEmail?: string;
    tickets: { ticketTypeId: string; quantity: number }[];
  }): Promise<IOrder> => {
    const response = await axiosInstance.post('/ticketing/orders', data);
    return response.data.data;
  },

  getOrderById: async (id: string): Promise<IOrder> => {
    const response = await axiosInstance.get(`/ticketing/orders/${id}`);
    return response.data.data;
  },

  getMyOrders: async (): Promise<IOrder[]> => {
    const response = await axiosInstance.get('/ticketing/orders/my');
    return response.data.data;
  },

  getEventOrders: async (eventId: string): Promise<IOrder[]> => {
    const response = await axiosInstance.get(`/ticketing/orders/event/${eventId}`);
    return response.data.data;
  },

  getAllOrders: async (page: number = 1, limit: number = 20): Promise<{ docs: IOrder[]; total: number }> => {
    const response = await axiosInstance.get('/ticketing/orders', {
      params: { page, limit },
    });
    return {
      docs: response.data.data,
      total: response.data.metadata?.pagination?.total || response.data.data.length,
    };
  },

  // Registrations
  getMyRegistrations: async (): Promise<IRegistration[]> => {
    const response = await axiosInstance.get('/ticketing/registrations/my');
    return response.data.data;
  },

  getEventRegistrations: async (eventId: string): Promise<IRegistration[]> => {
    const response = await axiosInstance.get(`/ticketing/registrations/event/${eventId}`);
    return response.data.data;
  },

  getAllRegistrations: async (page: number = 1, limit: number = 20): Promise<{ docs: IRegistration[]; total: number }> => {
    const response = await axiosInstance.get('/ticketing/registrations', {
      params: { page, limit },
    });
    return {
      docs: response.data.data,
      total: response.data.metadata?.pagination?.total || response.data.data.length,
    };
  },

  cancelRegistration: async (id: string): Promise<IRegistration> => {
    const response = await axiosInstance.post(`/ticketing/registrations/${id}/cancel`);
    return response.data.data;
  },

  // Waitlist
  joinWaitlist: async (data: { eventId: string; ticketTypeId?: string; name?: string }): Promise<IWaitlist> => {
    const response = await axiosInstance.post('/ticketing/waitlist/join', data);
    return response.data.data;
  },

  getEventWaitlist: async (eventId: string): Promise<IWaitlist[]> => {
    const response = await axiosInstance.get(`/ticketing/waitlist/event/${eventId}`);
    return response.data.data;
  },

  getMyWaitlistPosition: async (eventId: string): Promise<number | null> => {
    const response = await axiosInstance.get(`/ticketing/waitlist/event/${eventId}/my-position`);
    return response.data.data.position;
  },

  leaveWaitlist: async (id: string): Promise<IWaitlist> => {
    const response = await axiosInstance.post(`/ticketing/waitlist/${id}/leave`);
    return response.data.data;
  },

  promoteWaitlistEntry: async (id: string): Promise<IRegistration> => {
    const response = await axiosInstance.post(`/ticketing/waitlist/${id}/promote`);
    return response.data.data;
  },

  // QR Validation System
  validateQrCode: async (qrCode: string): Promise<IRegistration> => {
    const response = await axiosInstance.post('/ticketing/qr/validate', { qrCode });
    return response.data.data;
  },

  // Approvals & Workflow Queue
  approveRegistration: async (id: string): Promise<IRegistration> => {
    const response = await axiosInstance.post(`/ticketing/registrations/${id}/approve`);
    return response.data.data;
  },

  rejectRegistration: async (id: string): Promise<IRegistration> => {
    const response = await axiosInstance.post(`/ticketing/registrations/${id}/reject`);
    return response.data.data;
  },

  // Invitations (Invite-only events)
  inviteAttendee: async (eventId: string, email: string): Promise<any> => {
    const response = await axiosInstance.post(`/ticketing/events/${eventId}/invite`, { email });
    return response.data.data;
  },

  getEventInvitations: async (eventId: string): Promise<any[]> => {
    const response = await axiosInstance.get(`/ticketing/events/${eventId}/invitations`);
    return response.data.data;
  },

  revokeInvitation: async (id: string): Promise<any> => {
    const response = await axiosInstance.post(`/ticketing/invitations/${id}/revoke`);
    return response.data.data;
  },
};

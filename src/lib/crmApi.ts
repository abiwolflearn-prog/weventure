import { axiosInstance } from './axiosInstance';

export interface ICrmCompany {
  id?: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  website?: string;
  phone?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICrmContact {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: 'ACTIVE' | 'LEAD' | 'INACTIVE';
  leadSource?: string;
  companyId?: string | any;
  tags?: string[];
  customFields?: Record<string, any>;
  notes?: { author: string; content: string; createdAt: string }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ICrmLead {
  id?: string;
  contactId?: string | any;
  companyId?: string | any;
  title: string;
  dealValue: number;
  pipelineStage: 'NEW' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';
  status: 'ACTIVE' | 'WON' | 'LOST' | 'ARCHIVED';
  customFields?: Record<string, any>;
  notes?: { author: string; content: string; createdAt: string }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ICrmActivity {
  id?: string;
  contactId?: string | any;
  leadId?: string | any;
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'EVENT_REGISTRATION' | 'TICKET_PURCHASE' | 'WORKSPACE_BOOKING' | 'TASK' | 'SYSTEM';
  title: string;
  description?: string;
  date: string;
  assignedTo?: string;
  outcome?: string;
  details?: Record<string, any>;
  createdAt?: string;
}

export const crmApi = {
  // Dashboard Analytics
  getAnalytics: async () => {
    const res = await axiosInstance.get('/crm/analytics');
    return res.data.data;
  },

  // Companies
  getCompanies: async (search?: string) => {
    const res = await axiosInstance.get('/crm/companies', { params: { search } });
    return res.data.data as ICrmCompany[];
  },
  getCompany: async (id: string) => {
    const res = await axiosInstance.get(`/crm/companies/${id}`);
    return res.data.data as ICrmCompany;
  },
  createCompany: async (data: ICrmCompany) => {
    const res = await axiosInstance.post('/crm/companies', data);
    return res.data.data as ICrmCompany;
  },
  updateCompany: async (id: string, data: Partial<ICrmCompany>) => {
    const res = await axiosInstance.put(`/crm/companies/${id}`, data);
    return res.data.data as ICrmCompany;
  },
  deleteCompany: async (id: string) => {
    const res = await axiosInstance.delete(`/crm/companies/${id}`);
    return res.data.data;
  },

  // Contacts
  getContacts: async (search?: string, status?: string) => {
    const res = await axiosInstance.get('/crm/contacts', { params: { search, status } });
    return res.data.data as ICrmContact[];
  },
  getContact: async (id: string) => {
    const res = await axiosInstance.get(`/crm/contacts/${id}`);
    return res.data.data as ICrmContact & {
      integrations: {
        registrations: any[];
        bookings: any[];
        orders: any[];
      };
    };
  },
  createContact: async (data: ICrmContact) => {
    const res = await axiosInstance.post('/crm/contacts', data);
    return res.data.data as ICrmContact;
  },
  updateContact: async (id: string, data: Partial<ICrmContact>) => {
    const res = await axiosInstance.put(`/crm/contacts/${id}`, data);
    return res.data.data as ICrmContact;
  },
  deleteContact: async (id: string) => {
    const res = await axiosInstance.delete(`/crm/contacts/${id}`);
    return res.data.data;
  },
  addContactNote: async (id: string, author: string, content: string) => {
    const res = await axiosInstance.post(`/crm/contacts/${id}/notes`, { author, content });
    return res.data.data as ICrmContact;
  },

  // Leads
  getLeads: async (stage?: string, status?: string) => {
    const res = await axiosInstance.get('/crm/leads', { params: { stage, status } });
    return res.data.data as ICrmLead[];
  },
  getLead: async (id: string) => {
    const res = await axiosInstance.get(`/crm/leads/${id}`);
    return res.data.data as ICrmLead;
  },
  createLead: async (data: ICrmLead) => {
    const res = await axiosInstance.post('/crm/leads', data);
    return res.data.data as ICrmLead;
  },
  updateLead: async (id: string, data: Partial<ICrmLead>) => {
    const res = await axiosInstance.put(`/crm/leads/${id}`, data);
    return res.data.data as ICrmLead;
  },
  deleteLead: async (id: string) => {
    const res = await axiosInstance.delete(`/crm/leads/${id}`);
    return res.data.data;
  },
  addLeadNote: async (id: string, author: string, content: string) => {
    const res = await axiosInstance.post(`/crm/leads/${id}/notes`, { author, content });
    return res.data.data as ICrmLead;
  },

  // Activities
  getActivities: async (contactId?: string, leadId?: string) => {
    const res = await axiosInstance.get('/crm/activities', { params: { contactId, leadId } });
    return res.data.data as ICrmActivity[];
  },
  createActivity: async (data: ICrmActivity) => {
    const res = await axiosInstance.post('/crm/activities', data);
    return res.data.data as ICrmActivity;
  },
  deleteActivity: async (id: string) => {
    const res = await axiosInstance.delete(`/crm/activities/${id}`);
    return res.data.data;
  },
};

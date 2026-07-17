import axios from 'axios';

// Public API client that targets the exact root /api endpoints
const publicAxios = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Auto-inject tenant header
publicAxios.interceptors.request.use((config) => {
  const tenantId = localStorage.getItem('weventure_tenant_id') || 'weventurehub';
  config.headers['X-Tenant-ID'] = tenantId;
  return config;
});

export interface IPublicEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  schedule: {
    startDate: string;
    endDate: string;
    timezone: string;
  };
  capacity: {
    maxCapacity: number;
    activeRegistrations: number;
    isUnlimited: boolean;
  };
  registrationSettings?: {
    requiresApproval: boolean;
    customFormFields?: any[];
  };
  media: {
    bannerUrl?: string;
    imageUrls: string[];
  };
}

export interface IPublicWorkspace {
  id: string;
  name: string;
  type: 'HOT_DESK' | 'MEETING_ROOM' | 'EVENT_VENUE';
  capacity: number;
  hourlyRate: number;
  currency: string;
  amenities: string[];
  isAvailable: boolean;
}

export interface IPublicNews {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  imageUrl?: string;
  tags: string[];
  author: string;
  views: number;
  createdAt: string;
}

export interface IPublicSponsor {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string;
  tier: string;
}

export interface IPublicPartner {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string;
  type: string;
}

export interface IPublicHomepage {
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  heroCtaLink: string;
  heroImageUrl: string;
  promotionTitle: string;
  promotionSubtitle: string;
  promotionImageUrl: string;
  promotionPrice: string;
  communityHighlights: {
    title: string;
    description: string;
    imageUrl?: string;
  }[];
  startupPrograms: {
    title: string;
    description: string;
    duration: string;
    cohortSize: number;
    ctaText: string;
  }[];
}

export const publicApi = {
  // Events
  async getEvents() {
    const { data } = await publicAxios.get<{ success: boolean; data: IPublicEvent[] }>('/events');
    return data.data;
  },
  async getUpcomingEvents() {
    const { data } = await publicAxios.get<{ success: boolean; data: IPublicEvent[] }>('/events/upcoming');
    return data.data;
  },
  async getOngoingEvents() {
    const { data } = await publicAxios.get<{ success: boolean; data: IPublicEvent[] }>('/events/ongoing');
    return data.data;
  },
  async getCompletedEvents() {
    const { data } = await publicAxios.get<{ success: boolean; data: IPublicEvent[] }>('/events/completed');
    return data.data;
  },
  async getFeaturedEvents() {
    const { data } = await publicAxios.get<{ success: boolean; data: IPublicEvent[] }>('/events/featured');
    return data.data;
  },

  // Workspaces
  async getWorkspaces() {
    const { data } = await publicAxios.get<{ success: boolean; data: IPublicWorkspace[] }>('/workspaces');
    return data.data;
  },
  async getWorkspaceById(id: string) {
    const { data } = await publicAxios.get<{ success: boolean; data: IPublicWorkspace }>(`/workspaces/${id}`);
    return data.data;
  },
  async getWorkspaceAvailability(workspaceId: string, startTime?: string, endTime?: string) {
    const { data } = await publicAxios.get('/workspaces/availability', {
      params: { workspaceId, startTime, endTime }
    });
    return data.data;
  },

  // Bookings
  async createBooking(payload: {
    spaceId: string;
    startTime: string;
    endTime: string;
    purpose?: string;
    userEmail: string;
    userName?: string;
    paymentProvider?: string;
  }) {
    const { data } = await publicAxios.post<{ success: boolean; data: any }>('/bookings', payload);
    return data.data;
  },

  // News
  async getNews() {
    const { data } = await publicAxios.get<{ success: boolean; data: IPublicNews[] }>('/news');
    return data.data;
  },

  // Homepage Dynamic Config
  async getHomepage() {
    const { data } = await publicAxios.get<{ success: boolean; data: IPublicHomepage }>('/homepage');
    return data.data;
  },

  // Sponsors
  async getSponsors() {
    const { data } = await publicAxios.get<{ success: boolean; data: IPublicSponsor[] }>('/sponsors');
    return data.data;
  },

  // Partners
  async getPartners() {
    const { data } = await publicAxios.get<{ success: boolean; data: IPublicPartner[] }>('/partners');
    return data.data;
  },

  // Testimonials
  async getTestimonials() {
    const { data } = await publicAxios.get<{ success: boolean; data: any[] }>('/testimonials');
    return data.data;
  }
};

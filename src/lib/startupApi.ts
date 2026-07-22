import { axiosInstance } from './axiosInstance';

export interface StartupProgramItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  duration: string;
  cohortSize: number;
  icon: string;
  benefits: string[];
  eligibility: string;
  status: 'active' | 'upcoming' | 'closed';
  ctaText: string;
  sortOrder: number;
}

export interface StartupApplicationItem {
  id: string;
  programId?: string;
  programTitle?: string;
  startupName: string;
  founderName: string;
  email: string;
  phone: string;
  industry: string;
  startupStage: string;
  teamSize: string;
  website?: string;
  linkedIn?: string;
  briefDescription: string;
  currentChallenges?: string;
  fundingStatus?: string;
  status: 'pending' | 'under_review' | 'interview_scheduled' | 'approved' | 'rejected';
  reviewNotes?: string;
  createdAt: string;
}

export const startupApi = {
  // Public
  async getPrograms(): Promise<StartupProgramItem[]> {
    const { data } = await axiosInstance.get<{ success: boolean; data: { programs: StartupProgramItem[] } }>(
      '/startups/programs'
    );
    return data.data.programs;
  },

  async submitApplication(payload: {
    programId?: string;
    programTitle?: string;
    startupName: string;
    founderName: string;
    email: string;
    phone: string;
    industry: string;
    startupStage: string;
    teamSize: string;
    website?: string;
    linkedIn?: string;
    briefDescription: string;
    currentChallenges?: string;
    fundingStatus?: string;
  }) {
    const { data } = await axiosInstance.post<{ success: boolean; data: { application: StartupApplicationItem }; message?: string }>(
      '/startups/apply',
      payload
    );
    return data;
  },

  // Admin
  async getAllApplications(params?: { status?: string; industry?: string; search?: string }): Promise<StartupApplicationItem[]> {
    const { data } = await axiosInstance.get<{ success: boolean; data: { applications: StartupApplicationItem[] } }>(
      '/startups/applications',
      { params }
    );
    return data.data.applications;
  },

  async updateApplicationStatus(id: string, payload: { status?: string; reviewNotes?: string }) {
    const { data } = await axiosInstance.patch<{ success: boolean; data: { application: StartupApplicationItem } }>(
      `/startups/applications/${id}/status`,
      payload
    );
    return data.data.application;
  },

  async deleteApplication(id: string) {
    const { data } = await axiosInstance.delete<{ success: boolean }>(`/startups/applications/${id}`);
    return data;
  },

  async createProgram(payload: Partial<StartupProgramItem>) {
    const { data } = await axiosInstance.post<{ success: boolean; data: { program: StartupProgramItem } }>(
      '/startups/programs',
      payload
    );
    return data.data.program;
  },

  async updateProgram(id: string, payload: Partial<StartupProgramItem>) {
    const { data } = await axiosInstance.patch<{ success: boolean; data: { program: StartupProgramItem } }>(
      `/startups/programs/${id}`,
      payload
    );
    return data.data.program;
  },

  async deleteProgram(id: string) {
    const { data } = await axiosInstance.delete<{ success: boolean }>(`/startups/programs/${id}`);
    return data;
  },
};

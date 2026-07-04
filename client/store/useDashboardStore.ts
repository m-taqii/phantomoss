import { create } from 'zustand'
import axios from 'axios'

interface DashboardState {
  agency: any | null
  campaigns: any[]
  leads: any[]
  outreach: any[]
  learnings: any[]
  learningsPagination: { page: number, limit: number, total: number, pages: number } | null
  isFetchingAgency: boolean
  isFetchingCampaigns: boolean
  isFetchingLeads: boolean
  isFetchingOutreach: boolean
  isFetchingLearnings: boolean
  hasFetchedOnce: boolean

  fetchAgency: () => Promise<void>
  fetchCampaigns: () => Promise<void>
  fetchLeads: () => Promise<void>
  fetchOutreach: () => Promise<void>
  fetchLearnings: (page?: number, limit?: number) => Promise<void>
  fetchAll: () => Promise<void>
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  agency: null,
  campaigns: [],
  leads: [],
  outreach: [],
  learnings: [],
  learningsPagination: null,
  isFetchingAgency: false,
  isFetchingCampaigns: false,
  isFetchingLeads: false,
  isFetchingOutreach: false,
  isFetchingLearnings: false,
  hasFetchedOnce: false,

  fetchAgency: async () => {
    if (get().agency) return; // Cache hit
    set({ isFetchingAgency: true })
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/me`, { withCredentials: true })
      set({ agency: res.data?.data?.agency || null })
    } catch (e) {
      console.error('Failed to fetch agency:', e)
    } finally {
      set({ isFetchingAgency: false })
    }
  },

  fetchCampaigns: async () => {
    set({ isFetchingCampaigns: true })
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/campaigns`, { withCredentials: true })
      set({ campaigns: res.data?.data || res.data || [] })
    } catch (e) {
      console.error('Failed to fetch campaigns:', e)
    } finally {
      set({ isFetchingCampaigns: false })
    }
  },

  fetchLeads: async () => {
    set({ isFetchingLeads: true })
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/leads`, { withCredentials: true })
      set({ leads: res.data?.data || res.data || [] })
    } catch (e) {
      console.error('Failed to fetch leads:', e)
    } finally {
      set({ isFetchingLeads: false })
    }
  },

  fetchOutreach: async () => {
    set({ isFetchingOutreach: true })
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/outreach`, { withCredentials: true })
      set({ outreach: res.data?.data || res.data || [] })
    } catch (e) {
      console.error('Failed to fetch outreach:', e)
    } finally {
      set({ isFetchingOutreach: false })
    }
  },

  fetchLearnings: async (page = 1, limit = 10) => {
    set({ isFetchingLearnings: true })
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/learnings?page=${page}&limit=${limit}`, { withCredentials: true })
      set({ 
        learnings: res.data?.data?.learnings || [],
        learningsPagination: res.data?.data?.pagination || null
      })
    } catch (e) {
      console.error('Failed to fetch learnings:', e)
    } finally {
      set({ isFetchingLearnings: false })
    }
  },

  fetchAll: async () => {
    if (get().hasFetchedOnce) return;
    // Fire all initial fetches concurrently
    await Promise.all([
      get().fetchAgency(),
      get().fetchCampaigns(),
      get().fetchLeads(),
      get().fetchOutreach()
    ])
    set({ hasFetchedOnce: true })
  }
}))

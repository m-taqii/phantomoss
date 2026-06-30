import { create } from 'zustand'
import axios from 'axios'

interface DashboardState {
  agency: any | null
  campaigns: any[]
  leads: any[]
  outreach: any[]
  isFetchingAgency: boolean
  isFetchingCampaigns: boolean
  isFetchingLeads: boolean
  isFetchingOutreach: boolean
  hasFetchedOnce: boolean

  fetchAgency: () => Promise<void>
  fetchCampaigns: () => Promise<void>
  fetchLeads: () => Promise<void>
  fetchOutreach: () => Promise<void>
  fetchAll: () => Promise<void>
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  agency: null,
  campaigns: [],
  leads: [],
  outreach: [],
  isFetchingAgency: false,
  isFetchingCampaigns: false,
  isFetchingLeads: false,
  isFetchingOutreach: false,
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

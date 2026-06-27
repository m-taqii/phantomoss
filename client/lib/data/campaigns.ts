export type CampaignStatus = "draft" | "active" | "paused" | "completed" | "archived"
export type OutreachChannel = "email" | "whatsapp" | "linkedin" | "instagram"

export interface Campaign {
  id: string
  name: string
  status: CampaignStatus
  channel: OutreachChannel
  target: {
    industry: string
    location: string
    keywords: string[]
    companySize?: string
  }
  stats: {
    leadsFound: number
    leadsResearched: number
    emailsSent: number
    emailsOpened: number
    replies: number
    callsBooked: number
  }
  schedule: {
    dailyLimit: number
    warmupMode: boolean
    sendingHours: { start: number; end: number }
    followUpDays: number[]
  }
  lastRunAt?: string
  createdAt: string
}



export const statusConfig: Record<CampaignStatus, { label: string; dot: string; bg: string; text: string; border: string }> = {
  active:    { label: "Active",    dot: "bg-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" },
  draft:     { label: "Draft",     dot: "bg-gray-500",    bg: "bg-gray-500/10",    text: "text-gray-400",    border: "border-gray-500/20" },
  paused:    { label: "Paused",    dot: "bg-amber-500",   bg: "bg-amber-500/10",   text: "text-amber-500",   border: "border-amber-500/20" },
  completed: { label: "Completed", dot: "bg-blue-500",    bg: "bg-blue-500/10",    text: "text-blue-500",    border: "border-blue-500/20" },
  archived:  { label: "Archived",  dot: "bg-gray-600",    bg: "bg-gray-600/10",    text: "text-gray-500",    border: "border-gray-600/20" },
}

"use client"

import React, { useState, useEffect } from 'react'
import { Plus, Search, Layers, Loader2 } from 'lucide-react'
import { useMemo } from 'react'
import { useDashboardStore } from '@/store/useDashboardStore'

import { CampaignCard } from '@/components/dashboard/campaign-card'
import { CreateCampaignModal } from '@/components/dashboard/create-campaign-modal'
import { CampaignStatus, OutreachChannel, Campaign } from '@/lib/data/campaigns'

export default function CampaignsPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState<CampaignStatus | "all">("all")
  const [search, setSearch] = useState("")
  const rawCampaigns = useDashboardStore(state => state.campaigns)
  const fetchCampaigns = useDashboardStore(state => state.fetchCampaigns)
  const loading = useDashboardStore(state => state.isFetchingCampaigns)

  const campaigns = useMemo(() => {
    if (!Array.isArray(rawCampaigns)) return [];
    return rawCampaigns.map((c: any) => ({
      id: c._id,
      name: c.name,
      status: c.status,
      channel: c.channel,
      target: {
        industry: c.target?.industry || "",
        location: typeof c.target?.location === "object"
          ? [c.target?.location?.city, c.target?.location?.state, c.target?.location?.country].filter(Boolean).join(", ")
          : c.target?.location || "",
        keywords: c.target?.keywords || [],
        companySize: c.target?.companySize
      },
      stats: {
        leadsFound: c.stats?.leadsFound || 0,
        leadsResearched: c.stats?.leadsResearched || 0,
        emailsSent: c.stats?.emailsSent || 0,
        emailsOpened: c.stats?.emailsOpened || 0,
        replies: c.stats?.replies || 0,
        callsBooked: c.stats?.callsBooked || 0,
      },
      schedule: {
        dailyLimit: c.schedule?.dailyLimit || 30,
        warmupMode: c.schedule?.warmupMode || false,
        sendingHours: {
          start: c.schedule?.sendingHours?.start || 9,
          end: c.schedule?.sendingHours?.end || 18
        },
        followUpDays: c.schedule?.followUpDays || [3, 7]
      },
      lastRunAt: c.lastRunAt ? new Date(c.lastRunAt).toLocaleDateString() : undefined,
      createdAt: new Date(c.createdAt).toLocaleDateString()
    }));
  }, [rawCampaigns]);

  const filtered = campaigns.filter(c => {
    if (filter !== "all" && c.status !== filter) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const counts = {
    all: campaigns.length,
    active: campaigns.filter(c => c.status === "active").length,
    draft: campaigns.filter(c => c.status === "draft").length,
    paused: campaigns.filter(c => c.status === "paused").length,
    completed: campaigns.filter(c => c.status === "completed").length,
  }

  return (
    <div className="flex flex-col gap-5 text-foreground">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-4 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-semibold mb-0.5">Campaigns</h2>
          <p className="text-xs md:text-sm text-muted-foreground">Create and monitor your outreach campaigns.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center gap-2 bg-accent hover:bg-accent/80 text-black font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm w-full sm:w-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col gap-3 bg-card border border-border rounded-xl p-3 md:p-4">
        {/* Filter tabs - scrollable on mobile */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {(["all", "active", "draft", "paused", "completed"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors capitalize whitespace-nowrap ${
                filter === tab ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
              }`}
            >
              {tab} <span className="ml-1 opacity-60">{counts[tab as keyof typeof counts] ?? 0}</span>
            </button>
          ))}
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Campaign Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(campaign => (
            <CampaignCard key={campaign.id} campaign={campaign} onUpdate={fetchCampaigns} />
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl flex items-center justify-center p-12 min-h-[300px]">
          <div className="text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center mb-4">
              <Layers className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">No campaigns found</h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-5">
              {search ? "Try adjusting your search or filters." : "Create your first campaign to start hunting leads."}
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-accent hover:bg-accent/80 text-black font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Campaign
            </button>
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      <CreateCampaignModal isOpen={showCreate} onClose={() => setShowCreate(false)} onSuccess={fetchCampaigns} />
    </div>
  )
}

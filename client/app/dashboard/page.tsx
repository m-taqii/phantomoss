"use client"

import React, { useState, useEffect } from 'react'
import { CheckCircle2, MessageSquare, Plus, Mail } from 'lucide-react'
import { CreateCampaignModal } from '@/components/dashboard/create-campaign-modal'
import axios from 'axios'
import { useDashboardStore } from '@/store/useDashboardStore'

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

const Page = () => {
  const [showCreate, setShowCreate] = useState(false);
  const campaigns = useDashboardStore(state => state.campaigns) || [];

  const totalLeads = campaigns.reduce((acc, c) => acc + (c.stats?.leadsFound || 0), 0);
  const totalEmails = campaigns.reduce((acc, c) => acc + (c.stats?.emailsSent || 0), 0);
  const totalReplies = campaigns.reduce((acc, c) => acc + (c.stats?.replies || 0), 0);
  const totalCalls = campaigns.reduce((acc, c) => acc + (c.stats?.callsBooked || 0), 0);
  
  const replyRate = totalEmails > 0 ? ((totalReplies / totalEmails) * 100).toFixed(1) + '%' : '0%';

  return (
    <div className="flex flex-col gap-5 text-foreground">
      {/* Top Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        <div className="bg-card border border-border rounded-xl p-4 md:p-5 flex flex-col">
          <span className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 md:mb-3">Leads Found</span>
          <span className="text-2xl md:text-3xl font-bold mb-1">{totalLeads}</span>
          <span className="text-xs font-medium text-muted-foreground">Across all campaigns</span>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 md:p-5 flex flex-col">
          <span className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 md:mb-3">Emails Sent</span>
          <span className="text-2xl md:text-3xl font-bold mb-1">{totalEmails}</span>
          <span className="text-xs font-medium text-muted-foreground">Total volume</span>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 md:p-5 flex flex-col">
          <span className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 md:mb-3">Reply Rate</span>
          <span className="text-2xl md:text-3xl font-bold mb-1">{replyRate}</span>
          <span className="text-xs font-medium text-muted-foreground">Average conversion</span>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 md:p-5 flex flex-col">
          <span className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 md:mb-3">Calls Booked</span>
          <span className="text-2xl md:text-3xl font-bold mb-1">{totalCalls}</span>
          <span className="text-xs font-medium text-muted-foreground">Total scheduled</span>
        </div>
      </div>

      {/* Middle Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Agent Status */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Agent status</h2>
            <a href="#" className="text-accent text-sm font-medium hover:underline">view all →</a>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0"></span>
                <span className="font-semibold text-sm w-16 sm:w-24 shrink-0">Hunter</span>
                <span className="text-xs text-muted-foreground flex-1 truncate">Idle / Awaiting instructions</span>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-gray-500/10 text-muted-foreground border border-gray-500/20 shrink-0">idle</span>
            </div>
            
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0"></span>
                <span className="font-semibold text-sm w-16 sm:w-24 shrink-0">Researcher</span>
                <span className="text-xs text-muted-foreground flex-1 truncate">0 leads in queue</span>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-gray-500/10 text-muted-foreground border border-gray-500/20 shrink-0">idle</span>
            </div>
            
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0"></span>
                <span className="font-semibold text-sm w-16 sm:w-24 shrink-0">Outreach</span>
                <span className="text-xs text-muted-foreground flex-1 truncate">No active campaigns</span>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-gray-500/10 text-muted-foreground border border-gray-500/20 shrink-0">idle</span>
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0"></span>
                <span className="font-semibold text-sm w-16 sm:w-24 shrink-0">Reply Handler</span>
                <span className="text-xs text-muted-foreground flex-1 truncate">0 replies need review</span>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-gray-500/10 text-muted-foreground border border-gray-500/20 shrink-0">idle</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0"></span>
                <span className="font-semibold text-sm w-16 sm:w-24 shrink-0">Proposal</span>
                <span className="text-xs text-muted-foreground flex-1 truncate">No pending tasks</span>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-gray-500/10 text-muted-foreground border border-gray-500/20 shrink-0">idle</span>
            </div>
          </div>
        </div>


      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
        {/* Active Campaigns */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Active campaigns</h2>
            <button onClick={() => setShowCreate(true)} className="text-accent text-sm font-medium hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" /> new campaign
            </button>
          </div>

          <div className="flex flex-col gap-5">
            {campaigns.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">No active campaigns. Create one to begin.</div>
            ) : (
              campaigns.map((c: any) => {
                const total = c.stats?.leadsFound || 0;
                const sent = c.stats?.emailsSent || 0;
                const percent = total > 0 ? (sent / total) * 100 : 0;
                return (
                  <div key={c._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 border-b border-border gap-4 sm:gap-0">
                    <div className="flex items-center gap-3 w-full sm:w-56">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.status === 'active' ? 'bg-accent' : 'bg-gray-500'}`}></span>
                      <div className="flex flex-col truncate">
                        <span className={`font-semibold text-sm truncate ${c.status !== 'active' ? 'text-muted-foreground' : ''}`}>{c.name}</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground sm:flex-1">{total} leads - {c.stats?.replies || 0} replied</span>
                    <div className="w-full sm:w-24 h-1.5 bg-secondary rounded-full overflow-hidden shrink-0">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Today's Summary */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-6">Today&apos;s summary</h2>
          
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <span className="text-sm text-muted-foreground">Emails sent</span>
              <span className="text-sm font-semibold text-foreground">0 / 0</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <span className="text-sm text-muted-foreground">New leads</span>
              <span className="text-sm font-semibold text-foreground">0</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <span className="text-sm text-muted-foreground">Replies received</span>
              <span className="text-sm font-semibold text-foreground">0</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <span className="text-sm text-muted-foreground">Pending review</span>
              <span className="text-sm font-semibold text-foreground">0</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <span className="text-sm text-muted-foreground">Follow-ups due</span>
              <span className="text-sm font-semibold text-foreground">0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Domain health</span>
              <span className="text-sm font-semibold text-emerald-500">good</span>
            </div>
          </div>
        </div>
      </div>

      <CreateCampaignModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}

export default Page
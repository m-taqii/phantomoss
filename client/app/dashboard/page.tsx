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

  const [agentStatus, setAgentStatus] = useState<any>({
    hunter: { active: 0, waiting: 0, delayed: 0 },
    researcher: { active: 0, waiting: 0, delayed: 0 },
    outreach: { active: 0, waiting: 0, delayed: 0 },
    reply: { active: 0, waiting: 0, delayed: 0 },
  });

  useEffect(() => {
    const sse = new EventSource(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080'}/api/agency/agent-status`, {
      withCredentials: true
    });

    sse.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setAgentStatus(data);
      } catch (err) {
        console.error("Failed to parse SSE data", err);
      }
    };

    return () => {
      sse.close();
    };
  }, []);

  const totalLeads = campaigns.reduce((acc, c) => acc + (c.stats?.leadsFound || 0), 0);
  const totalEmails = campaigns.reduce((acc, c) => acc + (c.stats?.emailsSent || 0), 0);
  const totalReplies = campaigns.reduce((acc, c) => acc + (c.stats?.replies || 0), 0);
  const totalCalls = campaigns.reduce((acc, c) => acc + (c.stats?.callsBooked || 0), 0);
  
  const replyRate = totalEmails > 0 ? ((totalReplies / totalEmails) * 100).toFixed(1) + '%' : '0%';

  const renderAgentStatus = (name: string, data: any, defaultText: string) => {
    const isWorking = data?.active > 0 || data?.waiting > 0;
    const isWaiting = data?.waiting > 0;
    
    let description = defaultText;
    if (isWorking) {
        if (data.active > 0) description = `Processing ${data.active} job(s)...`;
        else if (data.waiting > 0) description = `${data.waiting} in queue`;
    }

    return (
      <div className="flex items-center justify-between pb-4 border-b border-border last:border-0 last:pb-0">
        <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isWorking ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`}></span>
          <span className="font-semibold text-sm w-16 sm:w-24 shrink-0">{name}</span>
          <span className={`text-xs flex-1 truncate ${isWorking ? 'text-emerald-500/80 font-medium' : 'text-muted-foreground'}`}>{description}</span>
        </div>
        <span className={`px-3 py-1 rounded-full text-[11px] font-bold border shrink-0 ${isWorking ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-gray-500/10 text-muted-foreground border-gray-500/20'}`}>
          {isWorking ? 'active' : 'idle'}
        </span>
      </div>
    );
  };

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
            {renderAgentStatus("Hunter", agentStatus.hunter, "Idle / Awaiting instructions")}
            {renderAgentStatus("Researcher", agentStatus.researcher, "0 leads in queue")}
            {renderAgentStatus("Outreach", agentStatus.outreach, "No active campaigns")}
            {renderAgentStatus("Reply Handler", agentStatus.reply, "0 replies need review")}
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

      </div>

      <CreateCampaignModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}

export default Page
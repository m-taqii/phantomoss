"use client"

import React, { useState, useRef, useEffect } from 'react'
import { MapPin, Tag, MoreHorizontal, Mail, BarChart2, Clock, Calendar, Edit, Trash2, Play, Pause, Target } from 'lucide-react'
import axios from 'axios'
import { useToast } from '@/hooks/use-toast'
import { CreateCampaignModal } from './create-campaign-modal'
import { StrategyViewer } from './strategy-viewer'
import { Campaign, statusConfig } from '@/lib/data/campaigns'

const StatusBadge = ({ status }: { status: Campaign['status'] }) => {
  const c = statusConfig[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${c.bg} ${c.text} border ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}

const StatItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: number | string }) => (
  <div className="flex items-center gap-2">
    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-xs font-semibold text-foreground ml-auto">{value}</span>
  </div>
)

export const CampaignCard = ({ campaign, onUpdate }: { campaign: Campaign, onUpdate?: () => void }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [rawCampaign, setRawCampaign] = useState(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
        setIsConfirmingDelete(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      return;
    }
    
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}/api/campaigns/${campaign.id}`, { withCredentials: true });
      toast({ title: "Campaign deleted", type: "success" });
      setShowMenu(false);
      setIsConfirmingDelete(false);
      if (onUpdate) onUpdate();
    } catch (err: any) {
      toast({ title: "Failed to delete", description: err.response?.data?.message || err.message, type: "error" });
    }
  };

  const handleEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/campaigns/${campaign.id}`, { withCredentials: true });
      setRawCampaign(res.data?.data || res.data);
      setShowEditModal(true);
      setShowMenu(false);
    } catch (err: any) {
      toast({ title: "Failed to fetch campaign details", type: "error" });
    }
  };
  const handleToggleStatus = async () => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_BASE_URL}/api/campaigns/${campaign.id}`, { status: newStatus }, { withCredentials: true });
      toast({ title: `Campaign ${newStatus}`, type: "success" });
      if (onUpdate) onUpdate();
      setShowMenu(false);
    } catch (e: any) {
      toast({ title: "Failed to update status", description: e.response?.data?.message, type: "error" });
    }
  };

  const progress = campaign.stats.leadsFound > 0 
    ? Math.round((campaign.stats.emailsSent / campaign.stats.leadsFound) * 100) 
    : 0

  return (
    <div className="bg-card border border-border rounded-xl p-6 hover:border-accent/30 transition-all duration-300 group">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0 mr-4">
          <h3 className="text-base font-semibold text-foreground truncate group-hover:text-accent transition-colors">{campaign.name}</h3>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" /> {campaign.target.location}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Tag className="w-3 h-3" /> {campaign.target.industry}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={campaign.status} />
          <div className="relative" ref={menuRef}>
            <button 
              onClick={(e) => { e.preventDefault(); setShowMenu(!showMenu); }} 
              className="w-8 h-8 rounded-lg hover:bg-foreground/5 flex items-center justify-center text-muted-foreground transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                {campaign.strategy && (
                  <button onClick={(e) => { e.preventDefault(); setShowStrategyModal(true); setShowMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-accent hover:bg-accent/10 transition-colors text-left font-medium">
                    <Target className="w-4 h-4" /> View Strategy
                  </button>
                )}
                <button onClick={handleEdit} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-foreground/5 transition-colors text-left">
                  <Edit className="w-4 h-4" /> Edit
                </button>
                {(campaign.status === 'active' || campaign.status === 'paused') && (
                  <button onClick={handleToggleStatus} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-foreground/5 transition-colors text-left">
                    {campaign.status === 'active' ? (
                      <><Pause className="w-4 h-4" /> Pause</>
                    ) : (
                      <><Play className="w-4 h-4" /> Resume</>
                    )}
                  </button>
                )}
                <button onClick={handleDelete} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors text-left">
                  <Trash2 className="w-4 h-4" /> {isConfirmingDelete ? "Click again to confirm" : "Delete"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-background/50 rounded-lg border border-border/50">
        <div className="text-center">
          <span className="block text-lg font-bold text-foreground">{campaign.stats.leadsFound}</span>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Leads</span>
        </div>
        <div className="text-center border-x border-border/50">
          <span className="block text-lg font-bold text-foreground">{campaign.stats.emailsSent}</span>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Sent</span>
        </div>
        <div className="text-center">
          <span className="block text-lg font-bold text-accent">{campaign.stats.callsBooked}</span>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Booked</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pipeline Progress</span>
          <span className="text-xs font-bold text-foreground">{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-linear-to-r from-accent to-emerald-400 rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>

      {/* Bottom Details */}
      <div className="grid grid-cols-2 gap-2">
        <StatItem icon={Mail} label="Replies" value={campaign.stats.replies} />
        <StatItem icon={BarChart2} label="Opened" value={campaign.stats.emailsOpened} />
        <StatItem icon={Clock} label="Limit" value={`${campaign.schedule.dailyLimit}/day`} />
        <StatItem icon={Calendar} label="Created" value={campaign.createdAt} />
      </div>

      {/* Last Run */}
      {campaign.lastRunAt && (
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${campaign.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`} />
          <span className="text-[10px] text-muted-foreground">Last run {campaign.lastRunAt}</span>
        </div>
      )}

      <CreateCampaignModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        onSuccess={onUpdate} 
        campaignToEdit={rawCampaign} 
      />

      <StrategyViewer 
        isOpen={showStrategyModal}
        onClose={() => setShowStrategyModal(false)}
        strategy={campaign.strategy}
      />
    </div>
  )
}

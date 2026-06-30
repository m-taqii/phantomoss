"use client"

import React, { useState } from 'react'
import { X, Users, Clock, Brain } from 'lucide-react'
import { OutreachChannel } from '@/lib/data/campaigns'
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  campaignToEdit?: any;
}

export function CreateCampaignModal({ isOpen, onClose, onSuccess, campaignToEdit }: CreateCampaignModalProps) {
  const [activeChannel, setActiveChannel] = useState<OutreachChannel>('email');
  const [warmupMode, setWarmupMode] = useState(true);
  const [autoSend, setAutoSend] = useState(false);
  const [followUpDaysInput, setFollowUpDaysInput] = useState("3, 7");
  const { toast } = useToast();
  const router = useRouter();

  const [campaignData, setCampaignData] = useState({
    name: '',
    industry: '',
    location: {
      country: '',
      state: '',
      city: '',
    },
    keywords: '',
    companySize: '',
    excludeDomains: '',
    instructions: '',
    startDate: '',
    endDate: '',
    dailyLimit: '30',
    followUpDays: [3, 7],
    schedule: '9',
    warmupMode: warmupMode,
  });

  React.useEffect(() => {
    if (isOpen && campaignToEdit) {
      setActiveChannel(campaignToEdit.channel || 'email');
      setWarmupMode(campaignToEdit.schedule?.warmupMode ?? true);
      setAutoSend(campaignToEdit.autoSend ?? false);
      setFollowUpDaysInput(campaignToEdit.schedule?.followUpDays?.join(", ") || "3, 7");
      
      setCampaignData({
        name: campaignToEdit.name || '',
        industry: campaignToEdit.target?.industry || '',
        location: {
          country: campaignToEdit.target?.location?.country || '',
          state: campaignToEdit.target?.location?.state || '',
          city: campaignToEdit.target?.location?.city || '',
        },
        keywords: campaignToEdit.target?.keywords?.join(", ") || '',
        companySize: campaignToEdit.target?.companySize || '',
        excludeDomains: campaignToEdit.target?.excludeDomains?.join(", ") || '',
        instructions: campaignToEdit.instructions || '',
        startDate: campaignToEdit.schedule?.startDate ? new Date(campaignToEdit.schedule.startDate).toISOString().split('T')[0] : '',
        endDate: campaignToEdit.schedule?.endDate ? new Date(campaignToEdit.schedule.endDate).toISOString().split('T')[0] : '',
        dailyLimit: campaignToEdit.schedule?.dailyLimit?.toString() || '30',
        followUpDays: campaignToEdit.schedule?.followUpDays || [3, 7],
        schedule: campaignToEdit.schedule?.schedule?.toString() || '9',
        warmupMode: campaignToEdit.schedule?.warmupMode ?? true,
      });
    } else if (isOpen && !campaignToEdit) {
      setCampaignData({
        name: '',
        industry: '',
        location: { country: '', state: '', city: '' },
        keywords: '',
        companySize: '',
        excludeDomains: '',
        instructions: '',
        startDate: '',
        endDate: '',
        dailyLimit: '30',
        followUpDays: [3, 7],
        schedule: '9',
        warmupMode: true,
      });
      setFollowUpDaysInput("3, 7");
      setActiveChannel("email");
      setAutoSend(false);
      setWarmupMode(true);
    }
  }, [isOpen, campaignToEdit]);

  const handleSubmit = async () => {
    if (!campaignData.name.trim() || !campaignData.location.country.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Campaign Name and Country are required.',
        type: 'error',
      });
      return;
    }

    try {
      const payload = {
        ...campaignData,
        followUpDays: followUpDaysInput.split(",").map(d => parseInt(d.trim())).filter(d => !isNaN(d)),
        channel: activeChannel,
        warmupMode,
        autoSend,
      };
      
      if (campaignToEdit) {
        await axios.put(`${process.env.NEXT_PUBLIC_BASE_URL}/api/campaigns/${campaignToEdit._id}`, payload, {
          withCredentials: true,
        });
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/campaigns`, payload, {
          withCredentials: true,
        });
      }
      
      toast({
        title: 'Campaign created successfully',
        description: 'Campaign created successfully',
        type: 'success',
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast({
        title: 'Error creating campaign',
        description: error.response?.data?.message,
        type: 'error',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90dvh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <h3 className="text-base font-semibold">{campaignToEdit ? 'Edit Campaign' : 'Create New Campaign'}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Define your target ICP and parameters</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-foreground/5 flex items-center justify-center text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Campaign Name</label>
            <input value={campaignData.name} onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })} type="text" className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-accent transition-colors" placeholder="e.g. Real Estate — Dubai UAE" />
          </div>

          <div className="p-4 bg-background/50 rounded-xl border border-border/50">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" /> Target ICP
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Industry</label>
                <input value={campaignData.industry} onChange={(e) => setCampaignData({ ...campaignData, industry: e.target.value })} type="text" className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-accent" placeholder="e.g. Real Estate" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Location</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input value={campaignData.location?.country} onChange={(e) => setCampaignData({ ...campaignData, location: { ...campaignData.location, country: e.target.value } })} type="text" className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-accent" placeholder="Country (Required)" />
                  <input value={campaignData.location?.state} onChange={(e) => setCampaignData({ ...campaignData, location: { ...campaignData.location, state: e.target.value } })} type="text" className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-accent" placeholder="State/Region (Optional)" />
                  <input value={campaignData.location?.city} onChange={(e) => setCampaignData({ ...campaignData, location: { ...campaignData.location, city: e.target.value } })} type="text" className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-accent" placeholder="City (Optional)" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Keywords</label>
                <input value={campaignData.keywords} onChange={(e) => setCampaignData({ ...campaignData, keywords: e.target.value })} type="text" className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-accent" placeholder="property, luxury, listings" />
                <p className="text-[10px] text-muted-foreground mt-1">Comma separated</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Company Size</label>
                <select value={campaignData.companySize} onChange={(e) => setCampaignData({ ...campaignData, companySize: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-accent">
                  <option value="">Any</option>
                  <option value="1-10">1-10</option>
                  <option value="10-50">10-50</option>
                  <option value="50-200">50-200</option>
                  <option value="200+">200+</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Exclude Domains</label>
                <input value={campaignData.excludeDomains} onChange={(e) => setCampaignData({ ...campaignData, excludeDomains: e.target.value })} type="text" className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-accent" placeholder="e.g. competitor.com, apple.com" />
                <p className="text-[10px] text-muted-foreground mt-1">Comma separated</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-background/50 rounded-xl border border-border/50">
            <h4 className="text-sm font-semibold text-foreground mb-3">Outreach Strategy</h4>
            <div className="mb-4">
              <label className="block text-xs font-medium text-muted-foreground mb-2">Outreach Channel</label>
              <div className="flex flex-wrap gap-2">
                {(["email"] as OutreachChannel[]).map(ch => (
                  <button 
                    key={ch} 
                    onClick={() => setActiveChannel(ch)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium capitalize transition-colors ${
                      ch === activeChannel ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground hover:border-foreground/20'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 bg-background/50 rounded-xl border border-border/50">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4 text-accent" /> Agent Instructions
            </h4>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Custom Instructions</label>
              <textarea value={campaignData.instructions} onChange={(e) => setCampaignData({ ...campaignData, instructions: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-accent min-h-[80px] resize-none" placeholder="E.g. Focus on finding technical founders. Mention our recent feature launches in the value prop."></textarea>
            </div>
          </div>

          <div className="p-4 bg-background/50 rounded-xl border border-border/50">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" /> Schedule
            </h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Start Date (Optional)</label>
                <input value={campaignData.startDate} onChange={(e) => setCampaignData({ ...campaignData, startDate: e.target.value })} type="date" className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">End Date (Optional)</label>
                <input value={campaignData.endDate} onChange={(e) => setCampaignData({ ...campaignData, endDate: e.target.value })} type="date" className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-accent" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Daily Limit</label>
                <input type="number" value={campaignData.dailyLimit} onChange={(e) => setCampaignData({ ...campaignData, dailyLimit: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-accent" max={50} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Follow-up Days</label>
                <input type="text" value={followUpDaysInput} onChange={(e) => setFollowUpDaysInput(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-accent" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Scheduled Time</label>
                <select value={campaignData.schedule} onChange={(e) => setCampaignData({ ...campaignData, schedule: e.target.value })} className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-accent">
                  {[...Array(24)].map((_, i) => <option key={i} value={i}>{i === 0 ? 12 : i > 12 ? i - 12 : i}:00 {i >= 12 ? 'PM' : 'AM'}</option>)}
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between flex-1">
                <div>
                  <span className="block text-sm font-medium text-foreground">Warmup Mode</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">Caps at 10 emails/day initially</span>
                </div>
                <div 
                  className={`relative inline-block w-10 h-6 rounded-full cursor-pointer shrink-0 transition-colors ${warmupMode ? 'bg-accent' : 'bg-border'}`}
                  onClick={() => setWarmupMode(!warmupMode)}
                >
                  <span className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform ${warmupMode ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>

              <div className="hidden sm:block w-px h-10 bg-border/50 mx-2"></div>

              <div className="flex items-center justify-between flex-1 border-t sm:border-t-0 border-border/50 pt-4 sm:pt-0">
                <div>
                  <span className="block text-sm font-medium text-foreground">Auto Send</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">Skip manual review for drafts</span>
                </div>
                <div 
                  className={`relative inline-block w-10 h-6 rounded-full cursor-pointer shrink-0 transition-colors ${autoSend ? 'bg-accent' : 'bg-border'}`}
                  onClick={() => setAutoSend(!autoSend)}
                >
                  <span className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform ${autoSend ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-border sticky bottom-0 bg-card">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-foreground/5 transition-colors">
            Cancel
          </button>
          <button onClick={() => handleSubmit()} className="flex-1 px-4 py-2.5 rounded-lg bg-accent hover:bg-accent/80 text-black text-sm font-semibold transition-colors">
            {campaignToEdit ? 'Save Changes' : 'Create Campaign'}
          </button>
        </div>
      </div>
    </div>
  );
}

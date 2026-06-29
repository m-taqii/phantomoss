"use client"

import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Mail, Unplug, Loader2, X } from 'lucide-react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

interface AgencyProfile {
  agencyName: string;
  website: string;
  agencyDescription: string;
  uniqueValue: string;
  calendarLink: string;
  services: string[];
  caseStudies: string[];
  settings: {
    timezone: string;
    autoReplyEnabled: boolean;
  };
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<AgencyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newService, setNewService] = useState('');
  const [newCaseStudy, setNewCaseStudy] = useState('');
  const { toast } = useToast();

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/api/agency/profile`, { withCredentials: true });
      setProfile(res.data.data);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load profile.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_BASE_URL}/api/agency/profile`, {
        agencyName: profile.agencyName,
        website: profile.website,
        agencyDescription: profile.agencyDescription,
        uniqueValue: profile.uniqueValue,
        calendarLink: profile.calendarLink,
        services: profile.services,
        caseStudies: profile.caseStudies,
        settings: profile.settings,
      }, { withCredentials: true });
      toast({ title: "Saved", description: "Settings updated successfully.", type: "success" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to save settings.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setProfile(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const addService = () => {
    if (!newService.trim() || !profile) return;
    updateField('services', [...profile.services, newService.trim()]);
    setNewService('');
  };

  const removeService = (index: number) => {
    if (!profile) return;
    updateField('services', profile.services.filter((_, i) => i !== index));
  };

  const addCaseStudy = () => {
    if (!newCaseStudy.trim() || !profile) return;
    updateField('caseStudies', [...profile.caseStudies, newCaseStudy.trim()]);
    setNewCaseStudy('');
  };

  const removeCaseStudy = (index: number) => {
    if (!profile) return;
    updateField('caseStudies', profile.caseStudies.filter((_, i) => i !== index));
  };

  const updateCaseStudy = (index: number, value: string) => {
    if (!profile) return;
    const updated = [...profile.caseStudies];
    updated[index] = value;
    updateField('caseStudies', updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="flex flex-col gap-5 text-foreground pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card border border-border rounded-xl p-4 md:p-6">
        <div>
          <h2 className="text-lg md:text-xl font-semibold mb-0.5">Workspace Settings</h2>
          <p className="text-xs md:text-sm text-muted-foreground">Manage agency details, email config, and agent context.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-accent hover:bg-accent/80 disabled:bg-accent/50 text-black font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm w-full sm:w-auto"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
        <div className="flex flex-col gap-5">

          {/* Agency Profile */}
          <div className="bg-card border border-border rounded-xl p-5 md:p-6">
            <h3 className="text-base font-semibold mb-0.5">Agency Profile</h3>
            <p className="text-xs text-muted-foreground mb-5">This context is injected into your agents so they understand who they represent.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Agency Name</label>
                <input
                  type="text"
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
                  value={profile.agencyName}
                  onChange={e => updateField('agencyName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Website</label>
                <input
                  type="url"
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
                  value={profile.website}
                  onChange={e => updateField('website', e.target.value)}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Agency Description</label>
              <textarea
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-accent min-h-[80px] resize-none transition-colors"
                value={profile.agencyDescription || ''}
                onChange={e => updateField('agencyDescription', e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Unique Value Proposition (USP)</label>
              <input
                type="text"
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
                value={profile.uniqueValue || ''}
                onChange={e => updateField('uniqueValue', e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground mt-1">Fed directly into Outreach Agent&apos;s pitch generation.</p>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Calendar Link</label>
              <input
                type="url"
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
                value={profile.calendarLink || ''}
                onChange={e => updateField('calendarLink', e.target.value)}
                placeholder="e.g. Calendly or Cal.com link"
              />
            </div>

            {/* Services */}
            <div className="pt-4 border-t border-border/50 mb-4">
              <label className="block text-xs font-medium text-muted-foreground mb-3">Core Services</label>
              <div className="flex flex-wrap gap-2">
                {profile.services.map((service, i) => (
                  <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-secondary rounded-md text-xs border border-border">
                    {service}
                    <button onClick={() => removeService(i)} className="hover:text-red-400 ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newService}
                    onChange={e => setNewService(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addService()}
                    placeholder="Add service..."
                    className="w-28 bg-background border border-dashed border-border rounded-md px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 transition-colors"
                  />
                  <button onClick={addService} className="p-1 text-muted-foreground hover:text-accent transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Case Studies */}
            <div className="pt-4 border-t border-border/50">
              <label className="block text-xs font-medium text-muted-foreground mb-3">Case Studies / Proof Points</label>
              <div className="flex flex-col gap-2">
                {profile.caseStudies.map((study, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      className="flex-1 min-w-0 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
                      value={study}
                      onChange={e => updateCaseStudy(i, e.target.value)}
                    />
                    <button onClick={() => removeCaseStudy(i)} className="p-2 text-muted-foreground hover:text-red-400 shrink-0 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCaseStudy}
                    onChange={e => setNewCaseStudy(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCaseStudy()}
                    placeholder="Add a case study..."
                    className="flex-1 min-w-0 bg-background border border-dashed border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 transition-colors"
                  />
                  <button onClick={addCaseStudy} className="self-start flex items-center gap-2 text-sm text-accent hover:underline px-2 py-2 transition-colors">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>


        </div>

        {/* Global Limits Sidebar */}
        <div className="flex flex-col gap-5">
          <div className="bg-card border border-border rounded-xl p-5 md:p-6">
            <h3 className="text-base font-semibold mb-4">Global Limits</h3>

            <div className="mb-4">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Max Daily Emails</label>
              <input type="number" className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-accent transition-colors" defaultValue={30} max={50} />
              <p className="text-[10px] text-muted-foreground mt-1.5">Max 50/day to maintain deliverability.</p>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Workspace Timezone</label>
              <select
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
                value={profile.settings?.timezone || 'UTC'}
                onChange={e => updateField('settings', { ...profile.settings, timezone: e.target.value })}
              >
                <option value="UTC">UTC (Universal Time)</option>
                <option value="EST">EST (Eastern Standard Time)</option>
                <option value="PST">PST (Pacific Standard Time)</option>
                <option value="CST">CST (Central Standard Time)</option>
                <option value="MST">MST (Mountain Standard Time)</option>
                <option value="GMT">GMT (Greenwich Mean Time)</option>
                <option value="CET">CET (Central European Time)</option>
                <option value="IST">IST (India Standard Time)</option>
                <option value="JST">JST (Japan Standard Time)</option>
                <option value="AEST">AEST (Australian Eastern Time)</option>
                <option value="GST">GST (Gulf Standard Time)</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/50 mb-4">
              <div>
                <span className="block text-sm font-medium text-foreground">Auto-Reply Handler</span>
                <span className="block text-[10px] text-muted-foreground mt-0.5">Allow agent to reply to interested leads</span>
              </div>
              <div 
                onClick={() => updateField('settings', { ...profile.settings, autoReplyEnabled: !profile.settings?.autoReplyEnabled })}
                className={`relative inline-block w-10 h-6 rounded-full cursor-pointer shrink-0 transition-colors ${profile.settings?.autoReplyEnabled !== false ? 'bg-accent' : 'bg-secondary border border-border'}`}
              >
                <span className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-black transition-transform ${profile.settings?.autoReplyEnabled !== false ? 'translate-x-4' : 'translate-x-0'}`}></span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <div>
                <span className="block text-sm font-medium text-foreground">Global Warmup</span>
                <span className="block text-[10px] text-muted-foreground mt-0.5">Caps sending at 10 emails/day</span>
              </div>
              <div className="relative inline-block w-10 h-6 rounded-full bg-accent cursor-pointer shrink-0">
                <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-black transition-transform translate-x-4"></span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}


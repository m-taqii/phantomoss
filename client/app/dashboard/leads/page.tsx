"use client"

import React, { useEffect, useState, useMemo } from 'react';
import { Download, Search, CheckCircle2, Building2, MapPin, Globe, Sparkles, Filter, X, Zap, Mail, Loader2, Trash2, Eye, Upload, Check } from 'lucide-react';
import axios from 'axios';
import { useDashboardStore } from '@/store/useDashboardStore';
import { useToast } from '@/hooks/use-toast';
import { statusStyles, LeadStatus } from '@/lib/data/leads';
import { LeadDetailsModal } from '@/components/dashboard/lead-details-modal';

interface MappedLead {
  id: string;
  company: {
    name: string;
    website: string;
    industry: string;
    location: string;
  };
  contact: {
    name?: string;
    title?: string;
    email?: string;
    emailConfidence: number;
  };
  research: {
    summary: string;
    painPoints: string[];
    recentActivity: string[];
    techStack: string[];
    competitors: string[];
  };
  status: LeadStatus;
  score: number;
  addedAt: string;
  raw: any;
}

export default function LeadsPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<MappedLead | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const { toast } = useToast();

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return diffMins <= 1 ? "just now" : `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  const cleanUrl = (url: string) => {
    if (!url) return "";
    return url.replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  };

  const rawLeads = useDashboardStore(state => state.leads);
  const fetchLeads = useDashboardStore(state => state.fetchLeads);
  const loading = useDashboardStore(state => state.isFetchingLeads);

  const leads = useMemo(() => {
    if (!Array.isArray(rawLeads)) return [];
    return rawLeads.map((lead: any) => ({
      id: lead._id,
      company: {
        name: lead.company?.name || "Unknown Company",
        website: lead.company?.website || "",
        industry: lead.company?.industry || "Real Estate",
        location: lead.company?.location || "",
      },
      contact: {
        name: lead.contact?.name || "",
        title: lead.contact?.title || "",
        email: lead.contact?.email || "",
        emailConfidence: lead.contact?.emailConfidence || 0,
      },
      research: {
        summary: lead.research?.summary || "",
        painPoints: lead.research?.painPoints || [],
        recentActivity: lead.research?.recentActivity || [],
        techStack: lead.research?.techStack || [],
        competitors: lead.research?.competitors || [],
      },
      status: lead.status || "discovered",
      score: lead.score || 0,
      addedAt: lead.createdAt ? formatRelativeTime(new Date(lead.createdAt)) : "Just now",
      raw: lead
    }));
  }, [rawLeads]);

  const handleApproveLead = async (leadId: string) => {
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_BASE_URL}/api/leads/${leadId}`, {
        status: "approved",
        humanApproved: true
      }, { withCredentials: true });

      toast({
        title: "Lead Approved",
        description: "Target has been added to outreach queue.",
        type: "success"
      });
      
      // Refresh from store
      await fetchLeads();
      if (selectedLead?.id === leadId) {
        setSelectedLead(prev => prev ? { ...prev, status: 'approved' } : null);
      }
    } catch (error) {
      console.error("Failed to approve lead:", error);
      toast({
        title: "Approval Failed",
        description: "Failed to approve lead in the remote database.",
        type: "error"
      });
    }
  };

  // Action: Reject / Delete Lead
  const handleRejectLead = async (leadId: string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}/api/leads/${leadId}`, {
        withCredentials: true
      });

      toast({
        title: "Lead Disapproved",
        description: "Target has been removed from the database.",
        type: "success"
      });

      await fetchLeads();
      setIsDetailsOpen(false);
      setSelectedLead(null);
    } catch (error) {
      console.error("Failed to reject lead:", error);
      toast({
        title: "Rejection Failed",
        description: "Failed to remove lead from the remote database.",
        type: "error"
      });
    }
  };

  const handleOpenDetails = (lead: MappedLead) => {
    setSelectedLead(lead);
    setIsDetailsOpen(true);
  };

  // Export to CSV Function
  const exportToCSV = () => {
    if (leads.length === 0) return;
    const headers = ["Company Name", "Website", "Industry", "Location", "Contact Name", "Contact Title", "Contact Email", "Confidence Score", "AI Fit Score", "Status", "Added At"];
    const rows = filtered.map(lead => [
      lead.company.name,
      lead.company.website,
      lead.company.industry,
      lead.company.location,
      lead.contact.name || "",
      lead.contact.title || "",
      lead.contact.email || "",
      lead.contact.emailConfidence,
      lead.score,
      lead.status,
      lead.addedAt
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `phantom_leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



  // Filtering
  const filtered = leads.filter(l => {
    // Search filter
    const matchesSearch = 
      l.company.name.toLowerCase().includes(search.toLowerCase()) ||
      l.contact.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.contact.email?.toLowerCase().includes(search.toLowerCase()) ||
      l.company.industry.toLowerCase().includes(search.toLowerCase());

    // Tab filter
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "needs_review") return matchesSearch && l.status === "researched";
    if (activeTab === "approved") return matchesSearch && l.status === "approved";
    if (activeTab === "outreached") return matchesSearch && ["queued", "contacted", "followed_up"].includes(l.status);
    if (activeTab === "replied") return matchesSearch && l.status === "replied";
    if (activeTab === "won") return matchesSearch && ["call_booked", "proposal_sent", "converted"].includes(l.status);

    return matchesSearch && l.status === activeTab;
  });

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeTab]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedLeads = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Tab counts helper
  const getTabCount = (tab: string) => {
    if (tab === "all") return leads.length;
    if (tab === "needs_review") return leads.filter(l => l.status === "researched").length;
    if (tab === "approved") return leads.filter(l => l.status === "approved").length;
    if (tab === "outreached") return leads.filter(l => ["queued", "contacted", "followed_up"].includes(l.status)).length;
    if (tab === "replied") return leads.filter(l => l.status === "replied").length;
    if (tab === "won") return leads.filter(l => ["call_booked", "proposal_sent", "converted"].includes(l.status)).length;
    return leads.filter(l => l.status === tab).length;
  };

  return (
    <div className="flex flex-col gap-5 text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card border border-border rounded-xl p-4 md:p-6">
        <div>
          <h2 className="text-lg md:text-xl font-semibold mb-0.5">Leads</h2>
          <p className="text-xs md:text-sm text-muted-foreground">Manage and track your AI-discovered prospects.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={exportToCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-accent hover:bg-accent/80 text-black font-semibold px-3 md:px-4 py-2.5 rounded-lg transition-colors text-sm cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card border border-border rounded-xl p-3 md:p-4 flex flex-col gap-3">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide border-b border-border/50 pb-2">
          {[
            { id: 'all', label: 'All Leads' },
            { id: 'needs_review', label: 'Needs Review' },
            { id: 'approved', label: 'Approved' },
            { id: 'outreached', label: 'Outreached' },
            { id: 'replied', label: 'Replies' },
            { id: 'won', label: 'Meetings Booked' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-accent/10 text-accent border border-accent/20' 
                  : 'text-muted-foreground border border-transparent hover:text-foreground hover:bg-foreground/5'
              }`}
            >
              {tab.label} <span className="ml-1 opacity-60 text-[10px] font-mono">({getTabCount(tab.id)})</span>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by company, key contact, email or industry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
            />
          </div>
          <button className="flex items-center justify-center gap-2 bg-secondary border border-border hover:bg-foreground/5 text-foreground px-4 py-2 rounded-lg text-sm transition-colors shrink-0 cursor-pointer">
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>
      </div>

      {/* Table / List card */}
      <div className="bg-card border border-border rounded-xl flex flex-col min-h-[400px]">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
            <p className="text-sm text-muted-foreground font-medium">Accessing Swarm Ledger...</p>
          </div>
        ) : (
          <>
            {/* Mobile list view */}
            <div className="md:hidden divide-y divide-border/50">
              {paginatedLeads.map((lead, idx) => {
                const s = statusStyles[lead.status as LeadStatus] || { label: lead.status, bg: 'bg-gray-500/10', text: 'text-gray-400', icon: Mail };
                const StatusIcon = s.icon;
                return (
                  <div 
                    key={idx} 
                    onClick={() => handleOpenDetails(lead)}
                    className="p-4 flex flex-col gap-2 hover:bg-foreground/2 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-foreground text-sm">{lead.company.name}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {lead.company.location || 'Remote'}</span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${s.bg} ${s.text} border border-border/50 shrink-0`}>
                        <StatusIcon className="w-3 h-3" />
                        {s.label}
                      </span>
                    </div>

                    {lead.contact.name && (
                      <div className="text-xs text-muted-foreground border-l-2 border-border/30 pl-2 py-0.5">
                        <span className="text-foreground font-semibold">{lead.contact.name}</span> · {lead.contact.title}
                        <div className="flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-muted-foreground/60" /> {lead.contact.email}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 mt-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg border border-border flex items-center justify-center font-bold text-xs bg-background">
                          {lead.score}
                        </div>
                        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${lead.score >= 80 ? 'bg-emerald-500' : lead.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${lead.score}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">{lead.addedAt}</span>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="px-6 py-16 text-center text-muted-foreground text-sm">
                  No leads found matching current filters.
                </div>
              )}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block flex-1 overflow-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-background/50 border-b border-border text-muted-foreground uppercase text-[10px] font-semibold tracking-wider sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Discovered</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {paginatedLeads.map(lead => {
                    const s = statusStyles[lead.status as LeadStatus] || { label: lead.status, bg: 'bg-gray-500/10', text: 'text-gray-400', icon: Mail };
                    const StatusIcon = s.icon;
                    return (
                      <tr 
                        key={lead.id} 
                        onClick={() => handleOpenDetails(lead)}
                        className="hover:bg-foreground/2 transition-colors group cursor-pointer"
                      >
                        <td className="px-6 py-4 max-w-[240px]">
                          <div className="font-semibold text-foreground truncate" title={lead.company.name}>
                            {lead.company.name}
                          </div>
                          <div className="flex items-center gap-2.5 mt-1 text-xs text-muted-foreground">
                            {lead.company.website && (
                              <span className="flex items-center gap-1 truncate max-w-[120px]" title={lead.company.website}>
                                <Globe className="w-3 h-3 shrink-0" /> {cleanUrl(lead.company.website)}
                              </span>
                            )}
                            <span className="flex items-center gap-1 truncate" title={lead.company.location || 'Remote'}>
                              <MapPin className="w-3 h-3 shrink-0" /> {lead.company.location || 'Remote'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-[220px]">
                          {lead.contact.name ? (
                            <>
                              <div className="font-semibold text-foreground truncate" title={`${lead.contact.name}${lead.contact.title ? ` • ${lead.contact.title}` : ''}`}>
                                {lead.contact.name} 
                                {lead.contact.title && (
                                  <span className="text-muted-foreground font-medium ml-1.5">• {lead.contact.title}</span>
                                )}
                              </div>
                              {lead.contact.email && (
                                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground/80 font-mono truncate" title={lead.contact.email}>
                                  <Mail className="w-3 h-3 shrink-0" /> 
                                  <span className="truncate">{lead.contact.email}</span>
                                  {lead.contact.emailConfidence >= 80 && (
                                    <span title="Verified Match" className="shrink-0">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    </span>
                                  )}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-muted-foreground italic text-xs">Hunting decision maker...</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg border border-border flex items-center justify-center font-bold text-xs bg-background">
                              {lead.score}
                            </div>
                            <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${lead.score >= 80 ? 'bg-emerald-500' : lead.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${lead.score}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold ${s.bg} ${s.text} border border-border/50`}>
                            <StatusIcon className="w-3 h-3" />
                            {s.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground font-mono">{lead.addedAt}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                            {lead.status === 'researched' && (
                              <button 
                                onClick={() => handleApproveLead(lead.id)}
                                className="p-1.5 rounded bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors cursor-pointer" 
                                title="Approve for outreach"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => handleOpenDetails(lead)}
                              className="p-1.5 rounded hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" 
                              title="View full context"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleRejectLead(lead.id)}
                              className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors cursor-pointer" 
                              title="Disapprove / Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center text-muted-foreground">
                        No leads found matching current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-background/50">
                <div className="text-sm text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium text-foreground">{Math.min(currentPage * pageSize, filtered.length)}</span> of <span className="font-medium text-foreground">{filtered.length}</span> leads
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-foreground/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((p, i, arr) => {
                        if (i > 0 && arr[i - 1] !== p - 1) {
                          return <span key={`ellipsis-${p}`} className="px-2 text-muted-foreground">...</span>;
                        }
                        return (
                          <button
                            key={p}
                            onClick={() => setCurrentPage(p)}
                            className={`w-8 h-8 flex items-center justify-center text-sm font-medium rounded-md transition-colors ${
                              currentPage === p
                                ? 'bg-accent text-accent-foreground'
                                : 'hover:bg-foreground/5 text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-foreground/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Details Slide-Over Drawer */}
      <LeadDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        lead={selectedLead}
        onApprove={handleApproveLead}
        onReject={handleRejectLead}
      />
    </div>
  );
}

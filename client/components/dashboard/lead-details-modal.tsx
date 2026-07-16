"use client"

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Globe, MapPin, Mail, Phone, Calendar, Users2,
  ExternalLink, Trash2, Check, CheckCircle2, AlertTriangle,
  Building2, Sparkles, Award, Edit2, Save
} from 'lucide-react';
import { statusStyles, LeadStatus } from '@/lib/data/leads';

// Custom robust SVG social icons to avoid lucide version incompatibilities
const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
  </svg>
);

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

interface LeadDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  onApprove: (leadId: string) => Promise<void>;
  onReject: (leadId: string) => Promise<void>;
  onUpdate?: (leadId: string, updates: any) => Promise<void>;
}

export const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({
  isOpen,
  onClose,
  lead,
  onApprove,
  onReject,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedContact, setEditedContact] = React.useState<any>({});
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && lead?.contact) {
      setEditedContact({
        name: lead.contact.name || '',
        title: lead.contact.title || '',
        email: lead.contact.email || '',
      });
      setIsEditing(false);
    }
  }, [isOpen, lead]);

  const handleSave = async () => {
    if (!onUpdate) return;
    setIsSaving(true);
    try {
      await onUpdate(lead.id, { contact: { ...lead.contact, ...editedContact } });
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (!lead) return null;

  const s = statusStyles[lead.status as LeadStatus] || { label: lead.status, bg: 'bg-gray-500/10', text: 'text-gray-400', icon: AlertTriangle };
  const StatusIcon = s.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Slide-over panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-2xl h-full bg-card border-l border-border flex flex-col shadow-2xl z-10 text-foreground"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground truncate max-w-[400px]">
                    {lead.company?.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${s.bg} ${s.text} border border-border/50`}>
                      <StatusIcon className="w-3 h-3" />
                      {s.label}
                    </span>
                    {lead.score && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-accent" /> Fit Score: <b>{lead.score}</b>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
              {/* AI Research Intelligence Summary */}
              {lead.research?.summary && (
                <div className="p-5 rounded-2xl border border-accent/20 bg-accent/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center gap-2 mb-3 text-accent text-sm font-semibold tracking-wide uppercase font-mono-tech">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    AI Intelligence Summary
                  </div>
                  <p className="text-sm md:text-base leading-relaxed text-foreground/90">
                    {lead.research.summary}
                  </p>
                </div>
              )}

              {/* Grid: Company Details & Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Information */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
                    Company Info
                  </h4>
                  <div className="space-y-3 text-sm">
                    {lead.company?.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                        <a
                          href={lead.company.website.startsWith('http') ? lead.company.website : `https://${lead.company.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent hover:underline flex items-center gap-1 truncate"
                        >
                          {lead.company.website}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {lead.company?.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-foreground/80">{lead.company.location}</span>
                      </div>
                    )}
                    {lead.company?.industry && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-foreground/80">{lead.company.industry}</span>
                      </div>
                    )}
                    {lead.raw?.company?.size && (
                      <div className="flex items-center gap-2">
                        <Users2 className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-foreground/80">Size: {lead.raw.company.size} employees</span>
                      </div>
                    )}
                    {lead.raw?.company?.foundedYear && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-foreground/80">Founded: {lead.raw.company.foundedYear}</span>
                      </div>
                    )}

                    {/* Socials */}
                    {lead.raw?.company?.socialLinks && Object.values(lead.raw.company.socialLinks).some(Boolean) && (
                      <div className="flex gap-2 pt-2 border-t border-border/50">
                        {lead.raw.company.socialLinks.linkedin && (
                          <a href={lead.raw.company.socialLinks.linkedin} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg border border-border bg-card hover:bg-foreground/5 transition-colors text-muted-foreground hover:text-foreground">
                            <LinkedinIcon className="w-4 h-4" />
                          </a>
                        )}
                        {lead.raw.company.socialLinks.twitter && (
                          <a href={lead.raw.company.socialLinks.twitter} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg border border-border bg-card hover:bg-foreground/5 transition-colors text-muted-foreground hover:text-foreground">
                            <TwitterIcon className="w-4 h-4" />
                          </a>
                        )}
                        {lead.raw.company.socialLinks.facebook && (
                          <a href={lead.raw.company.socialLinks.facebook} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg border border-border bg-card hover:bg-foreground/5 transition-colors text-muted-foreground hover:text-foreground">
                            <FacebookIcon className="w-4 h-4" />
                          </a>
                        )}
                        {lead.raw.company.socialLinks.instagram && (
                          <a href={lead.raw.company.socialLinks.instagram} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg border border-border bg-card hover:bg-foreground/5 transition-colors text-muted-foreground hover:text-foreground">
                            <InstagramIcon className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Key Contact
                    </h4>
                    {onUpdate && !isEditing && (
                      <button onClick={() => setIsEditing(true)} className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                    )}
                    {isEditing && (
                      <button onClick={handleSave} disabled={isSaving} className="text-xs flex items-center gap-1 text-emerald-500 hover:text-emerald-400 font-bold transition-colors">
                        <Save className="w-3 h-3" /> {isSaving ? "Saving..." : "Save"}
                      </button>
                    )}
                  </div>
                  <div className="space-y-3 text-sm">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
                          <input
                            type="text"
                            value={editedContact.name}
                            onChange={e => setEditedContact({ ...editedContact, name: e.target.value })}
                            className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm outline-none focus:border-accent/50 transition-colors"
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground">Job Title</label>
                          <input
                            type="text"
                            value={editedContact.title}
                            onChange={e => setEditedContact({ ...editedContact, title: e.target.value })}
                            className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm outline-none focus:border-accent/50 transition-colors"
                            placeholder="CEO"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
                          <input
                            type="email"
                            value={editedContact.email}
                            onChange={e => setEditedContact({ ...editedContact, email: e.target.value })}
                            className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm outline-none focus:border-accent/50 transition-colors font-mono"
                            placeholder="john@example.com"
                          />
                        </div>
                      </div>
                    ) : (lead.contact?.name || lead.contact?.email ? (
                      <>
                        {lead.contact?.name && (
                          <div className="font-semibold text-foreground">{lead.contact.name}</div>
                        )}
                        {lead.contact?.title && (
                          <div className="text-xs text-muted-foreground -mt-2 font-medium">{lead.contact.title}</div>
                        )}
                        {lead.contact?.email && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                              <span className="text-foreground/80 break-all select-all font-mono text-xs">{lead.contact.email}</span>
                            </div>
                            {lead.contact.emailConfidence !== undefined && (
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 bg-secondary h-1.5 rounded-full overflow-hidden max-w-[100px]">
                                  <div
                                    className={`h-full rounded-full ${lead.contact.emailConfidence >= 80 ? 'bg-emerald-500' : lead.contact.emailConfidence >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                    style={{ width: `${lead.contact.emailConfidence}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-muted-foreground font-semibold">
                                  {lead.contact.emailConfidence}% Confidence
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        {lead.raw?.contact?.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="text-foreground/80">{lead.raw.contact.phone}</span>
                          </div>
                        )}
                        {lead.raw?.contact?.linkedin && (
                          <div className="flex items-center gap-2">
                            <LinkedinIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                            <a href={lead.raw.contact.linkedin} target="_blank" rel="noreferrer" className="text-accent hover:underline flex items-center gap-0.5 text-xs">
                              View Profile <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-muted-foreground italic text-xs py-2">
                        No contact found yet. The Swarm is searching for decision makers...
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Identified Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border pt-6">
                {/* Pain Points */}
                {lead.research?.painPoints?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-red-400/90 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0" /> Pain Points Detected
                    </h4>
                    <ul className="space-y-2">
                      {lead.research.painPoints.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm bg-red-500/5 border border-red-500/10 rounded-lg p-2.5 text-foreground/80 leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tech Stack */}
                {lead.research?.techStack?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-accent/90 flex items-center gap-1.5">
                      <Globe className="w-4 h-4 shrink-0" /> Tech Stack / Signals
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {lead.research.techStack.map((tech: string, idx: number) => (
                        <span key={idx} className="text-xs font-semibold px-2.5 py-1 bg-secondary border border-border rounded-full text-foreground/80">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Activity & Competitors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border pt-6">
                {/* Recent Activity */}
                {lead.research?.recentActivity?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 shrink-0" /> Recent Activity / Events
                    </h4>
                    <ul className="list-disc list-inside space-y-1.5 text-sm text-foreground/80 leading-relaxed">
                      {lead.research.recentActivity.map((act: string, idx: number) => (
                        <li key={idx} className="pl-1">
                          {act}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Competitors */}
                {lead.research?.competitors?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <Users2 className="w-4 h-4 shrink-0" /> Key Competitors
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {lead.research.competitors.map((comp: string, idx: number) => (
                        <span key={idx} className="text-xs font-semibold px-2.5 py-1 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-indigo-300">
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-6 border-t border-border bg-background/50 flex items-center justify-between gap-3 shrink-0">
              <button
                onClick={() => onReject(lead.id)}
                className="flex items-center justify-center gap-2 border border-red-500/20 hover:border-red-500 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-bold px-4 py-2.5 rounded-lg text-sm transition-colors cursor-pointer shrink-0"
              >
                <Trash2 className="w-4 h-4" /> Disapprove
              </button>

              <div className="flex items-center gap-2">
                {lead.status === 'researched' && (
                  <button
                    onClick={() => onApprove(lead.id)}
                    className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-500/80 text-black font-black px-5 py-2.5 rounded-lg text-sm transition-colors cursor-pointer shrink-0"
                  >
                    <Check className="w-4 h-4" /> Approve Lead
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-lg border border-border text-foreground/80 hover:text-foreground hover:bg-foreground/5 font-semibold text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

import { Search, CheckCircle2, Clock, Mail, XCircle } from 'lucide-react';

export type LeadStatus = "discovered" | "researched" | "approved" | "queued" | "contacted" | "followed_up" | "replied" | "call_booked" | "proposal_sent" | "converted" | "not_interested" | "bounced" | "unsubscribed";

export interface Lead {
  id: string;
  company: { name: string; website: string; industry: string; location: string };
  contact: { name?: string; title?: string; email?: string; emailConfidence: number };
  research: { summary: string };
  status: LeadStatus;
  score: number;
  addedAt: string;
}


export const statusStyles: Record<LeadStatus, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  discovered: { label: "Discovered", bg: "bg-gray-500/10", text: "text-gray-400", icon: Search },
  researched: { label: "Researched", bg: "bg-blue-500/10", text: "text-blue-400", icon: Search },
  approved: { label: "Approved", bg: "bg-indigo-500/10", text: "text-indigo-400", icon: CheckCircle2 },
  queued: { label: "Queued", bg: "bg-amber-500/10", text: "text-amber-500", icon: Clock },
  contacted: { label: "Contacted", bg: "bg-purple-500/10", text: "text-purple-400", icon: Mail },
  followed_up: { label: "Followed Up", bg: "bg-purple-500/10", text: "text-purple-400", icon: Mail },
  replied: { label: "Replied", bg: "bg-accent/10", text: "text-accent", icon: Mail },
  call_booked: { label: "Call Booked", bg: "bg-emerald-500/10", text: "text-emerald-500", icon: CheckCircle2 },
  proposal_sent: { label: "Proposal Sent", bg: "bg-emerald-500/10", text: "text-emerald-500", icon: CheckCircle2 },
  converted: { label: "Converted", bg: "bg-emerald-500/10", text: "text-emerald-500", icon: CheckCircle2 },
  not_interested: { label: "Not Interested", bg: "bg-red-500/10", text: "text-red-400", icon: XCircle },
  bounced: { label: "Bounced", bg: "bg-red-500/10", text: "text-red-400", icon: XCircle },
  unsubscribed: { label: "Unsubscribed", bg: "bg-gray-500/10", text: "text-gray-400", icon: XCircle },
};

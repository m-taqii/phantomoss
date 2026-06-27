import { Target, Zap, Mail, MessageSquare } from 'lucide-react';
import React from 'react';

export interface AgentStats {
  id: string;
  name: string;
  role: string;
  icon: React.ElementType;
  color: string;
  bgConfig: string;
  status: "running" | "idle" | "paused" | "error";
  currentTask: string;
  metrics: { label: string; value: string | number }[];
  logs: { time: string; msg: string; type: 'info' | 'success' | 'warn' | 'error' }[];
}

export const mockAgents: AgentStats[] = [
  {
    id: "hunter",
    name: "Spectre",
    role: "Lead Generation Engine",
    icon: Target,
    color: "emerald-500",
    bgConfig: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    status: "running",
    currentTask: "Scraping Google Maps - 'Real Estate Dubai'",
    metrics: [
      { label: "Leads Found Today", value: 284 },
      { label: "Active Sources", value: 4 },
      { label: "Latency", value: "420ms" }
    ],
    logs: [
      { time: "10:42:01", msg: "Extracted 15 new leads from GMaps", type: "success" },
      { time: "10:41:15", msg: "Scanning Apollo.io for 'Property Management UAE'", type: "info" },
      { time: "10:40:02", msg: "Rate limit reached on LinkedIn, switching proxy", type: "warn" }
    ]
  },
  {
    id: "researcher",
    name: "Cipher",
    role: "Data Enrichment & Scoring",
    icon: Zap,
    color: "amber-500",
    bgConfig: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    status: "running",
    currentTask: "Processing queue (12 pending)",
    metrics: [
      { label: "Profiles Enriched", value: 196 },
      { label: "Avg Score", value: 72 },
      { label: "Processing Time", value: "1.2s/lead" }
    ],
    logs: [
      { time: "10:41:55", msg: "Enriched 'Golden Keys Agency' - Score: 98", type: "success" },
      { time: "10:41:53", msg: "Analyzing website: goldenkeys.ae", type: "info" },
      { time: "10:41:50", msg: "Fetching recent news for Golden Keys", type: "info" }
    ]
  },
  {
    id: "outreach",
    name: "Revenant",
    role: "Campaign Execution",
    icon: Mail,
    color: "purple-500",
    bgConfig: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    status: "paused",
    currentTask: "Daily sending limit reached (38/40)",
    metrics: [
      { label: "Emails Sent", value: 147 },
      { label: "Deliverability", value: "99.2%" },
      { label: "Spam Score", value: "0.1/10" }
    ],
    logs: [
      { time: "09:15:22", msg: "Daily limit warning (38/40 reached)", type: "warn" },
      { time: "09:15:01", msg: "Sent Follow-up 1 to 'Mohammed Al Farsi'", type: "success" },
      { time: "09:14:45", msg: "Drafting personalization for 'Mohammed Al Farsi'", type: "info" }
    ]
  },
  {
    id: "reply",
    name: "Echo",
    role: "Inbox Management",
    icon: MessageSquare,
    color: "accent",
    bgConfig: "bg-accent/10 text-accent border-accent/20",
    status: "idle",
    currentTask: "Waiting for new emails...",
    metrics: [
      { label: "Replies Processed", value: 21 },
      { label: "Positive Intent", value: "35%" },
      { label: "Drafts Created", value: 18 }
    ],
    logs: [
      { time: "08:30:12", msg: "Classified reply from 'Elena Rostova' -> WANTS_CALL (98%)", type: "success" },
      { time: "08:30:10", msg: "New email received from elena@goldenkeys.ae", type: "info" },
      { time: "07:15:00", msg: "Classified reply from 'James Holden' -> NOT_INTERESTED (95%)", type: "success" }
    ]
  }
];

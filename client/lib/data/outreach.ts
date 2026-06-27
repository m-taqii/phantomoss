export type OutreachType = "initial" | "followup_1" | "followup_2" | "reply" | "proposal";
export type OutreachStatus = "draft" | "scheduled" | "sent" | "delivered" | "bounced" | "failed";

export interface OutreachMessage {
  id: string;
  leadName: string;
  companyName: string;
  type: OutreachType;
  status: OutreachStatus;
  subject: string;
  bodyPreview: string;
  date: string;
  channel: "email" | "linkedin" | "whatsapp";
}


export const statusStyles: Record<OutreachStatus, { label: string; dot: string; bg: string; text: string }> = {
  draft: { label: "Draft", dot: "bg-gray-500", bg: "bg-gray-500/10", text: "text-gray-400" },
  scheduled: { label: "Scheduled", dot: "bg-amber-500", bg: "bg-amber-500/10", text: "text-amber-500" },
  sent: { label: "Sent", dot: "bg-blue-500", bg: "bg-blue-500/10", text: "text-blue-400" },
  delivered: { label: "Delivered", dot: "bg-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-500" },
  bounced: { label: "Bounced", dot: "bg-red-500", bg: "bg-red-500/10", text: "text-red-400" },
  failed: { label: "Failed", dot: "bg-red-500", bg: "bg-red-500/10", text: "text-red-400" }
};

export const typeStyles: Record<OutreachType, string> = {
  initial: "Initial Touch",
  followup_1: "Follow-up 1",
  followup_2: "Follow-up 2",
  reply: "Reply",
  proposal: "Proposal"
};

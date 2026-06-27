export type ReplyIntent = "interested" | "not_interested" | "has_questions" | "wants_call" | "out_of_office" | "unknown";

export interface Reply {
  id: string;
  leadName: string;
  companyName: string;
  body: string;
  receivedAt: string;
  intent: ReplyIntent;
  intentConfidence: number;
  draftResponse?: string;
  humanReviewed: boolean;
}


export const intentStyles: Record<ReplyIntent, { label: string; bg: string; text: string }> = {
  interested: { label: "Interested", bg: "bg-emerald-500/10", text: "text-emerald-500" },
  wants_call: { label: "Wants Call", bg: "bg-emerald-500/10", text: "text-emerald-500" },
  has_questions: { label: "Questions", bg: "bg-amber-500/10", text: "text-amber-500" },
  not_interested: { label: "Not Interested", bg: "bg-red-500/10", text: "text-red-400" },
  out_of_office: { label: "OOO", bg: "bg-gray-500/10", text: "text-gray-400" },
  unknown: { label: "Needs Review", bg: "bg-purple-500/10", text: "text-purple-400" }
};

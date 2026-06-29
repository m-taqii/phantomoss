import { Annotation } from "@langchain/langgraph";

export type ReplyIntent =
  | "interested"
  | "not_interested"
  | "question"
  | "out_of_office"
  | "bounced"
  | "unknown";

export const ReplyStateAnnotation = Annotation.Root({
  // --- INPUT ---

  leadId: Annotation<string>({
    reducer: (_, b) => b,
  }),

  campaignId: Annotation<string>({
    reducer: (_, b) => b,
  }),

  // The raw inbound reply text
  replyText: Annotation<string>({
    reducer: (_, b) => b,
  }),

  // The text of the email we originally sent to them
  previousEmailText: Annotation<string>({
    reducer: (_, b) => b,
    default: () => "",
  }),

  autoSend: Annotation<boolean>({
    reducer: (_, b) => b,
    default: () => false,
  }),

  // The SMTP Message-ID we are replying to, required for threading
  inReplyTo: Annotation<string>({
    reducer: (_, b) => b,
    default: () => "",
  }),

  company: Annotation<{
    name: string;
    industry: string;
  }>({
    reducer: (_, b) => b,
  }),

  contact: Annotation<{
    name?: string;
    email: string;
  }>({
    reducer: (_, b) => b,
  }),

  research: Annotation<{
    painPoints: string[];
    summary: string;
  }>({
    reducer: (_, b) => b,
  }),

  agency: Annotation<{
    ownerName: string;
    calendarLink?: string;
    fromName: string;
    signature?: string;
  }>({
    reducer: (_, b) => b,
  }),

  // Strategic guidelines from the Strategist
  strategyGuidelines: Annotation<{
    guidelines: string;
    objectionApproaches: Record<string, string>;
    bookingTriggers: string[];
    instructions: string;
  } | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),

  // --- OUTPUT ---

  intent: Annotation<ReplyIntent>({
    reducer: (_, b) => b,
    default: () => "unknown",
  }),

  draftReply: Annotation<{
    subject: string;
    body: string;
  } | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),

  triggerCallBooking: Annotation<boolean>({
    reducer: (_, b) => b,
    default: () => false,
  }),

  error: Annotation<string | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),
});

export type ReplyState = typeof ReplyStateAnnotation.State;

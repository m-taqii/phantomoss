import { Annotation } from "@langchain/langgraph";

/*
OUTREACHER AGENT STATE
 
Input:  researched lead + agency profile (the "from" context)
Output: a written email (subject + body) ready to send
*/
export const OutreacherStateAnnotation = Annotation.Root({

  leadId: Annotation<string>({
    reducer: (_, b) => b,
  }),

  campaignId: Annotation<string>({
    reducer: (_, b) => b,
  }),

  // Auto send - if true, email will be sent immediately
  autoSend: Annotation<boolean>({
    reducer: (_, b) => b,
    default: () => false,
  }),

  // Determines if this is an initial outreach or a follow-up
  outreachType: Annotation<"initial" | "followup_1" | "followup_2">({
    reducer: (_, b) => b,
    default: () => "initial",
  }),

  // Optional SMTP Message-ID to thread the follow-up
  inReplyTo: Annotation<string | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),

  // Previous message context to inform the follow-up copy
  previousMessageBody: Annotation<string | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),

  // Lead context
  company: Annotation<{
    name: string;
    website: string;
    industry: string;
    location: string;
  }>({
    reducer: (_, b) => b,
  }),

  // lead contact info
  contact: Annotation<{
    name?: string;
    title?: string;
    email: string;
  }>({
    reducer: (_, b) => b,
  }),

  // Research intel - for personalization
  research: Annotation<{
    painPoints: string[];
    recentActivity: string[];
    techStack: string[];
    summary: string;
  }>({
    reducer: (_, b) => b,
  }),

  // Agency "from" context — personalizes the pitch (sender context/agency details)
  agency: Annotation<{
    name: string;
    ownerName: string;
    agencyName?: string;
    email?: string;
    services: string[];
    uniqueValue: string;
    caseStudies: string[];
    calendarLink?: string;
    fromEmail: string;
    fromName: string;
    signature?: string;
    emailConfig?: {
      fromName?: string;
      fromAddress?: string;
      imapHost?: string;
      imapPort?: number;
      imapUser?: string;
      imapPass?: string;
      signature?: string;
    };
  }>({
    reducer: (_, b) => b,
  }),

  email: Annotation<{
    subject: string;
    body: string;
  } | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),

  error: Annotation<string | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),
});

export type OutreacherState = typeof OutreacherStateAnnotation.State;

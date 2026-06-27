import { Annotation } from "@langchain/langgraph";
import type { CampaignStrategy } from "../../../schemas/strategy.schema";

/*
  STRATEGIST AGENT STATE

  Input:  Campaign config, Agency profile, optional user instructions, optional learnings
  Output: A complete campaign strategy object that downstream agents consume
*/

export const StrategistStateAnnotation = Annotation.Root({
  // INPUT (set by the worker before invoking the graph)

  campaignId: Annotation<string>({
    reducer: (_, b) => b,
  }),

  // Agency context — who we are and what we sell
  agency: Annotation<{
    name: string;
    description: string;
    services: string[];
    targetIndustries: string[];
    uniqueValue: string;
    caseStudies: string[];
    calendarLink?: string;
  }>({ reducer: (_, b) => b }),

  // Campaign targeting config — what we're going after
  campaign: Annotation<{
    name: string;
    channel: string;
    target: {
      industry: string;
      location: { country?: string; state?: string; city?: string };
      keywords: string[];
      companySize?: string;
      excludeDomains: string[];
    };
    schedule: {
      dailyLimit: number;
      sendingHours: { start: number; end: number };
      followUpDays: number[];
      warmupMode: boolean;
    };
  }>({ reducer: (_, b) => b }),

  // Optional user instructions — free-text strategic guidance
  instructions: Annotation<string | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),

  learnings: Annotation<string[]>({
    reducer: (_, b) => b,
    default: () => [],
  }),

  // Previous strategy — passed during refinement runs so the Strategist can see what changed
  previousStrategy: Annotation<Record<string, any> | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),

  // OUTPUT (populated by the strategist node) 

  strategy: Annotation<CampaignStrategy | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),

  // Control flow
  error: Annotation<string | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),
});

export type StrategistState = typeof StrategistStateAnnotation.State;

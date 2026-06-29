import { z } from "zod";

export const CampaignStrategySchema = z.object({
  icp: z.object({
    idealCompanyProfile: z.string().min(10),
    searchAngles: z.array(z.string().min(3)).min(3).max(10),
    qualificationCriteria: z.array(z.string().min(3)).min(2).max(8),
    disqualifiers: z.array(z.string().min(3)).min(1).max(8),
    knownDirectories: z.array(z.string()).default([]),
    instructions: z.string().default(""),
  }),

  outreach: z.object({
    tone: z.string().min(2),
    openingStrategy: z.string().min(10),
    valueProposition: z.string().min(10),
    callToAction: z.string().min(5),
    followUpStrategy: z.string().min(10),
    avoidTopics: z.array(z.string()).default([]),
    instructions: z.string().default(""),
  }),

  research: z.object({
    prioritySignals: z.array(z.string().min(3)).min(2).max(8),
    painPointHypotheses: z.array(z.string().min(3)).min(2).max(8),
    competitorContext: z.string().min(10),
    instructions: z.string().default(""),
  }),

  reply: z.object({
    guidelines: z.string().min(10),
    objectionApproaches: z.record(z.string(), z.string()).default({}),
    bookingTriggers: z.array(z.string()).min(1).max(6),
    instructions: z.string().default(""),
  }),

  targetCities: z.array(z.string()).default([]),
  summary: z.string().min(20),
});

export type CampaignStrategy = z.infer<typeof CampaignStrategySchema>;

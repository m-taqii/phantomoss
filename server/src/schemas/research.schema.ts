import { z } from "zod";

export const ResearchOutputSchema = z.object({
  painPoints: z.array(z.string().min(5)).min(1).max(8),
  recentActivity: z.array(z.string()).default([]),
  techStack: z.array(z.string()).default([]),
  competitors: z.array(z.string()).default([]),
  summary: z.string().min(20),
  // 2-3 sentences: what they do + how WE specifically can help them
  businessBrief: z.string().min(20),
  // Disqualification — true if score < 60 or no contact found
  disqualified: z.boolean().default(false),
  disqualifyReason: z.string().optional(),
  updatedContact: z.object({
    name: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    linkedin: z.string().nullable().optional(),
    instagram: z.string().nullable().optional(),
    emailSource: z.enum(["verified", "corrected", "guessed"]).optional(),
  }).optional(),
  score: z.number().min(0).max(100),
});

export type ResearchOutput = z.infer<typeof ResearchOutputSchema>;

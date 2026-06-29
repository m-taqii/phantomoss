import { z } from "zod";

export const replyIntentSchema = z.object({
  intent: z.enum([
    "interested",
    "not_interested",
    "question",
    "out_of_office",
    "bounced",
    "unknown"
  ]).describe("The core intent of the incoming reply."),
  confidence: z.number().min(0).max(100).describe("Confidence score of this classification 0-100."),
  draftRequired: z.boolean().describe("True if the intent is interested or a question, requiring a response draft."),
  draftSubject: z.string().optional().describe("If draftRequired is true, the suggested subject line for the reply (keep RE: if present)."),
  draftBody: z.string().optional().describe("If draftRequired is true, the full drafted email body. If they asked a question, answer it. If they are interested, offer a call using the calendar link."),
});

export type ReplyIntentOutput = z.infer<typeof replyIntentSchema>;

import { getLLM } from "../../../../lib/ai";
import { learnerAnalysisPrompt } from "../prompts";
import { Campaign } from "../../../../models/campaign.model";
import { Lead } from "../../../../models/lead.model";
import { Outreach } from "../../../../models/outreach.model";
import { Learning } from "../../../../models/learning.model";
import type { LearnerState } from "../state";
import { z } from "zod";

const MAX_RETRIES = 3;
const MAX_SAMPLES = 15;

const InsightsSchema = z.object({
  workingAngles: z.array(z.string()).default([]),
  failingAngles: z.array(z.string()).default([]),
  commonObjections: z.array(z.string()).default([]),
  successfulRebuttals: z.array(z.string()).default([]),
  icpRefinements: z.array(z.string()).default([]),
});

export async function analyzeNode(state: LearnerState): Promise<Partial<LearnerState>> {
  const { campaignId } = state;

  try {
    // 1. Fetch campaign
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return { error: `Campaign ${campaignId} not found` };
    }

    // 2. Aggregate metrics from the Outreach collection
    const [sentCount, repliedOutreaches, bouncedCount] = await Promise.all([
      Outreach.countDocuments({ campaignId, status: "sent" }),
      Outreach.find({ campaignId, "reply.intent": { $exists: true } }).lean(),
      Outreach.countDocuments({ campaignId, status: "bounced" }),
    ]);

    const totalReplied = repliedOutreaches.length;
    const totalNotInterested = repliedOutreaches.filter(o => o.reply?.intent === "not_interested").length;
    const totalInterested = repliedOutreaches.filter(o => o.reply?.intent === "interested").length;
    const totalQuestionsAsked = repliedOutreaches.filter(o => o.reply?.intent === "has_questions").length;

    const replyRate = sentCount > 0 ? totalReplied / sentCount : 0;
    const positiveRate = totalReplied > 0 ? (totalInterested + totalQuestionsAsked) / totalReplied : 0;

    const metrics = {
      totalSent: sentCount,
      totalReplied,
      totalBounced: bouncedCount,
      totalNotInterested,
      totalInterested,
      totalQuestionsAsked,
      replyRate,
      positiveRate,
    };

    // 3. Build sample replies (most recent, capped at MAX_SAMPLES)
    const sampleOutreaches = repliedOutreaches
      .filter(o => o.reply?.body && o.message?.body)
      .slice(-MAX_SAMPLES);

    const sampleReplies = sampleOutreaches.map(o => ({
      intent: o.reply!.intent,
      replySnippet: o.reply!.body.slice(0, 300),
      ourEmailSnippet: o.message.body.slice(0, 300),
    }));

    // 4. Build the LLM prompt
    const loc = [
      campaign.target.location?.city,
      campaign.target.location?.state,
      campaign.target.location?.country,
    ].filter(Boolean).join(", ");

    const prompt = learnerAnalysisPrompt({
      campaignName: campaign.name,
      industry: campaign.target.industry,
      location: loc,
      currentStrategySummary: campaign.strategy?.summary || "No strategy summary available.",
      metrics,
      sampleReplies,
    });

    // 5. Call the LLM with retries
    let insights = {
      workingAngles: [] as string[],
      failingAngles: [] as string[],
      commonObjections: [] as string[],
      successfulRebuttals: [] as string[],
      icpRefinements: [] as string[],
    };

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const llm = getLLM("fast");
        const response = await llm.invoke([
          { role: "system", content: prompt },
          { role: "user", content: "Analyze the campaign data and generate structured insights now." },
        ]);

        const raw = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
        const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();

        const parsed = JSON.parse(cleaned);
        const result = InsightsSchema.safeParse(parsed);

        if (result.success) {
          insights = result.data;
          console.log(`[Learner] Insights extracted successfully (attempt ${attempt})`);
          break;
        } else {
          console.warn(`[Learner] Attempt ${attempt}: Zod validation failed, retrying...`);
        }
      } catch (err: any) {
        console.warn(`[Learner] Attempt ${attempt}: LLM error, retrying...`, err.message);
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
    }

    // 6. Save the Learning document with the previous strategy snapshot
    const learning = await Learning.create({
      campaignId,
      metrics,
      insights,
      sampleReplies,
      previousStrategy: campaign.strategy ? JSON.parse(JSON.stringify(campaign.strategy)) : null,
      generatedAt: new Date(),
    });

    console.log(`[Learner] Learning ${learning._id} saved for campaign ${campaignId}`);

    return { learningId: learning._id.toString(), error: null };
  } catch (err: any) {
    console.error(`[Learner] Analysis failed:`, err);
    return { error: err.message };
  }
}

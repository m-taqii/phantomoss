import { getLLM } from "../../../../lib/ai";
import { ReplyStateAnnotation } from "../state";
import { replyIntentSchema } from "../../../../schemas/reply.schema";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { replySystemPrompt } from "../prompts";

export async function replyNode(state: typeof ReplyStateAnnotation.State): Promise<Partial<typeof ReplyStateAnnotation.State>> {
  console.log(`[ReplyAgent] Classifying inbound email from ${state.contact.email}`);

  const llm = getLLM("flash");

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", replySystemPrompt(state)],
    ["human", "INBOUND EMAIL:\n\n{replyText}"]
  ]);

  try {
    const chain = prompt.pipe(llm);
    const response = await chain.invoke({
      replyText: state.replyText,
    });
    
    const raw = typeof response.content === "string" 
      ? response.content 
      : JSON.stringify(response.content);
      
    let cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    
    let parsedJson: unknown;
    try {
        parsedJson = JSON.parse(cleaned);
    } catch {
        throw new Error(`Failed to parse JSON from LLM response: \n\n${raw}`);
    }
    
    const result = replyIntentSchema.safeParse(parsedJson);
    if (!result.success) {
        throw new Error(`Reply intent validation failed: ${JSON.stringify(result.error.issues)}`);
    }

    const data = result.data;
    console.log(`[ReplyAgent] Intent classified as: ${data.intent}`);

    let draftReply = null;
    if (data.draftRequired && data.draftSubject && data.draftBody) {
      draftReply = {
        subject: data.draftSubject,
        body: data.draftBody,
      };
    }

    // Update Lead status based on intent
    const { Lead } = await import("../../../../models/lead.model");
    const { Campaign } = await import("../../../../models/campaign.model");
    
    // Increment total replies for the campaign
    await Campaign.findByIdAndUpdate(state.campaignId, { $inc: { "stats.replies": 1 } });
    
    if (data.intent === "not_interested") {
      await Lead.findByIdAndUpdate(state.leadId, { $set: { status: "not_interested" } });
      console.log(`[ReplyAgent] Lead ${state.leadId} marked as not_interested`);
    } else if (data.intent === "bounced") {
      await Lead.findByIdAndUpdate(state.leadId, { $set: { status: "bounced" } });
      console.log(`[ReplyAgent] Lead ${state.leadId} marked as bounced`);
    }

    return {
      intent: data.intent,
      draftReply,
      triggerCallBooking: data.intent === "interested",
    };
  } catch (err: any) {
    console.error(`[ReplyAgent] Failed to classify intent:`, err);
    return {
      intent: "unknown",
      error: err.message,
    };
  }
}

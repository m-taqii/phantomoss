import { ReplyStateAnnotation } from "../state";
import { Lead } from "../../../../models/lead.model";

export default async function optOutNode(state: typeof ReplyStateAnnotation.State): Promise<Partial<typeof ReplyStateAnnotation.State>> {
  if (!state.leadId) return {};

  try {
    const lead = await Lead.findById(state.leadId);
    if (lead) {
      lead.status = "not_interested";
      await lead.save();
      console.log(`[ReplyAgent] Lead ${state.leadId} marked as not_interested (Opt-Out)`);
    }
    return {};
  } catch (err: any) {
    console.error(`[ReplyAgent] Failed to opt out lead:`, err);
    return { error: err.message };
  }
}

import { getLLM } from "../../../../lib/ai";
import { strategistPrompt } from "../prompts";
import { CampaignStrategySchema } from "../../../../schemas/strategy.schema";
import type { StrategistState } from "../state";

const MAX_RETRIES = 3;

export async function strategizeNode(
  state: StrategistState
): Promise<Partial<StrategistState>> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const llm = getLLM("smart");
      const prompt = strategistPrompt(state);

      const response = await llm.invoke([
        { role: "system", content: prompt },
        { role: "user", content: "Analyze the campaign and agency context, then generate the campaign strategy now." }
      ]);

      const raw = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
      let cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        cleaned = match[0];
      }

      // Parse JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        console.error(`[Strategist] Attempt ${attempt}: Failed to parse JSON, retrying...`);
        continue;
      }

      // Validate with Zod
      const result = CampaignStrategySchema.safeParse(parsed);
      if (!result.success) {
        console.error(`[Strategist] Attempt ${attempt}: Zod validation failed, retrying...`, JSON.stringify(result.error.issues, null, 2));
        continue;
      }

      console.log(`[Strategist] Strategy generated successfully (attempt ${attempt})`);
      return { strategy: result.data, error: null };
    } catch (error: any) {
      const status = error?.status || error?.statusCode || "unknown";
      console.warn(`[Strategist] Attempt ${attempt}: API error (${status}), rotating provider...`);
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }

  console.error(`[Strategist] All ${MAX_RETRIES} attempts failed — strategy generation aborted`);
  return { error: "Strategy generation failed after all retry attempts" };
}

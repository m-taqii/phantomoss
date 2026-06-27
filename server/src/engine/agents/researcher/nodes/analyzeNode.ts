import { getLLM } from "../../../../lib/ai";
import { researchAnalysisPrompt } from "../prompts";
import { ResearchOutputSchema } from "../../../../schemas/research.schema";
import type { ResearcherState } from "../state";

const MAX_RETRIES = 3;

/*
  ANALYZE NODE

  Takes the full scraped website content (homepage + subpages) and the contact
  details extracted by contactNode, then uses a smart LLM to produce:
    - Specific pain points
    - Business brief (what they do + how WE can help them)
    - ICP fit score (0-100)
    - Contact verification / enrichment
    - Disqualification decision if score < 60 or site is junk
*/

export async function analyzeNode(
  state: ResearcherState
): Promise<Partial<ResearcherState>> {

  if (!state.scrapedContent && !state.company.description) {
    console.warn(`[AnalyzeNode] No scraped content for ${state.company.name} — disqualifying.`);
    return {
      error: "No website content available",
      score: 0,
    };
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const llm = getLLM("smart");
      const prompt = researchAnalysisPrompt(state);

      const response = await llm.invoke([
        { role: "system", content: prompt },
        { role: "user", content: "Analyze the website content and produce the research intelligence now." },
      ]);

      const raw = typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

      const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();

      let parsed: unknown;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        console.error(`[AnalyzeNode] Attempt ${attempt}: Failed to parse JSON, retrying...`);
        continue;
      }

      const result = ResearchOutputSchema.safeParse(parsed);
      if (!result.success) {
        console.error(
          `[AnalyzeNode] Attempt ${attempt}: Zod validation failed:`,
          JSON.stringify(result.error.issues, null, 2)
        );
        continue;
      }

      const data = result.data;

      console.log(
        `[AnalyzeNode] Research complete for ${state.company.name}: ` +
        `score=${data.score}, disqualified=${data.disqualified}, ` +
        `painPoints=${data.painPoints.length} (attempt ${attempt})`
      );

      return {
        research: {
          painPoints: data.painPoints,
          recentActivity: data.recentActivity,
          techStack: data.techStack,
          competitors: data.competitors,
          summary: data.summary,
          businessBrief: data.businessBrief,
          updatedContact: data.updatedContact,
        },
        contact: {
          ...state.contact,
          ...(data.updatedContact?.name && { name: data.updatedContact.name }),
          ...(data.updatedContact?.title && { title: data.updatedContact.title }),
          ...(data.updatedContact?.email && { email: data.updatedContact.email }),
          ...(data.updatedContact?.phone && { phone: data.updatedContact.phone }),
          ...(data.updatedContact?.linkedin && { linkedin: data.updatedContact.linkedin }),
          ...(data.updatedContact?.instagram && { instagram: data.updatedContact.instagram }),
          ...(data.updatedContact?.emailSource && { emailSource: data.updatedContact.emailSource }),
        },
        disqualified: data.disqualified,
        disqualifyReason: data.disqualifyReason ?? null,
        score: data.score,
        error: null,
      };
    } catch (error: any) {
      const status = error?.status || error?.statusCode || "unknown";
      console.warn(`[AnalyzeNode] Attempt ${attempt}: API error (${status}), rotating provider...`);
      if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }

  console.error(`[AnalyzeNode] All ${MAX_RETRIES} attempts failed for ${state.company.name}`);
  return { error: "Research analysis failed after all retry attempts" };
}

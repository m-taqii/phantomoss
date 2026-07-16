import { getLLM } from "../../../../lib/ai";
import { researchAnalysisPrompt } from "../prompts";
import { ResearchOutputSchema } from "../../../../schemas/research.schema";
import type { ResearcherState } from "../state";

const MAX_RETRIES = 3;

/**
 * Smart truncation to drastically reduce token usage while keeping context.
 * Homepage: 3000 chars
 * About: 2000 chars
 * Services: 2000 chars
 * Contact: 1000 chars
 */
function truncateScrapedContent(content: string): string {
  if (!content) return "";
  
  const sections = content.split("=== ");
  let truncatedSections: string[] = [];

  for (const sec of sections) {
    if (!sec.trim()) continue;
    
    // Add back the separator we split on
    const fullSection = "=== " + sec;
    
    // Determine budget based on URL/title
    const firstLine = fullSection.split("\\n")[0]?.toLowerCase() || "";
    let budget = 1000; // default for unknown pages
    
    if (firstLine.includes("homepage")) {
      budget = 3000;
    } else if (firstLine.includes("about") || firstLine.includes("team")) {
      budget = 2000;
    } else if (firstLine.includes("services") || firstLine.includes("product") || firstLine.includes("solutions")) {
      budget = 2000;
    } else if (firstLine.includes("contact")) {
      budget = 1000;
    }
    
    if (fullSection.length > budget) {
      truncatedSections.push(fullSection.substring(0, budget) + "\\n... [Content Truncated] ...");
    } else {
      truncatedSections.push(fullSection);
    }
  }

  return truncatedSections.join("\\n\\n");
}

/*
  ANALYZE NODE

  Takes the FULL scraped website content (truncated for cost savings) and the contact
  details extracted by contactNode, then uses a FAST LLM to produce:
    - Specific pain points
    - Business brief (what they do + how WE can help them)
    - ICP fit score (0-100)
    - Contact extraction from hints
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

  // 1. Truncate content to save massive amounts of tokens (~50K -> ~8K)
  const truncatedContent = truncateScrapedContent(state.scrapedContent);
  const optimizedState = { ...state, scrapedContent: truncatedContent };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // 2. Switch from "smart" (max) to "fast" (plus) for structured extraction
      const llm = getLLM("fast");
      const prompt = researchAnalysisPrompt(optimizedState);

      const response = await llm.invoke([
        { role: "system", content: prompt },
        { role: "user", content: "Analyze the website content and produce the research intelligence now." },
      ]);

      const raw = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
      let cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        cleaned = match[0];
      }

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
      
      // Ping SMTP to verify the email if it wasn't already verified by Hunter
      let finalEmail = data.updatedContact?.email;
      let finalEmailSource = data.updatedContact?.emailSource || state.contact.emailSource || "guessed";

      if (finalEmailSource !== "verified") {
        const { pingVerifyEmail } = await import("../../../../services/verifier.service");
        let foundValid = false;

        // Collect all emails to test (prioritizing the main email, then guessed emails)
        const emailsToTest: string[] = [];
        if (finalEmail) emailsToTest.push(finalEmail);
        if (data.updatedContact?.guessedEmails && Array.isArray(data.updatedContact.guessedEmails)) {
          for (const email of data.updatedContact.guessedEmails) {
            if (email && !emailsToTest.includes(email)) emailsToTest.push(email);
          }
        }

        if (emailsToTest.length > 0) {
          console.log(`[AnalyzeNode] Testing ${emailsToTest.length} unverified emails via SMTP ping...`);
          
          for (const emailToTest of emailsToTest) {
            const isValid = await pingVerifyEmail(emailToTest);
            if (isValid) {
              console.log(`[AnalyzeNode] SMTP ping SUCCESS for ${emailToTest}`);
              finalEmail = emailToTest;
              finalEmailSource = "verified";
              foundValid = true;
              break;
            } else {
              console.log(`[AnalyzeNode] SMTP ping FAILED for ${emailToTest}`);
            }
          }
        }

        if (!foundValid) {
          // If all failed, default to the first email in the list (or fallback generic)
          finalEmail = emailsToTest[0] || `info@${state.company.domain.replace(/^www\./, "")}`;
          finalEmailSource = "guessed";
        }
      }
      
      // Update data with the final verified/guessed email
      if (data.updatedContact) {
        data.updatedContact.email = finalEmail;
        data.updatedContact.emailSource = finalEmailSource as "verified" | "guessed" | "corrected";
      }

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
          emailSource: data.updatedContact?.emailSource || state.contact.emailSource || "guessed",
        },
        disqualified: data.disqualified,
        disqualifyReason: data.disqualifyReason ?? null,
        score: data.score,
        error: null,
      };
    } catch (error: any) {
      const status = error?.status || error?.statusCode || "unknown";
      console.warn(`[AnalyzeNode] Attempt ${attempt}: API error (${status})`);
      if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }

  console.error(`[AnalyzeNode] All ${MAX_RETRIES} attempts failed for ${state.company.name}`);
  return { error: "Research analysis failed after all retry attempts" };
}

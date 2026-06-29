import type { ResearcherState } from "../state";
import { getLLM } from "../../../../lib/ai";
import { z } from "zod";
import { findDomainEmails } from "../../../../services/hunterio.service";
import { ContactOutputSchema } from "../../../../schemas/research.schema";
import { buildContactPrompt } from "../prompts";

/*
  CONTACT NODE (Researcher Agent)

  Runs after the scrape node has collected the full website content.
  Uses regex to quickly extract emails/phones from raw text, then
  uses a fast LLM call to identify the decision-maker and their contact info.

  By running AFTER the deep scrape (which already includes About, Team, Contact subpages),
  this node has vastly more content to work with than the old Hunter contact node did.
*/

// Regex-based pre-extraction
function extractContactHints(content: string): {
  emails: string[];
  phones: string[];
  socialLinks: { platform: string; url: string }[];
} {
  const emails = new Set<string>();
  const phones = new Set<string>();
  const socialLinks: { platform: string; url: string }[] = [];
  const seenSocials = new Set<string>();

  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const mailtoRegex = /mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/gi;

  for (const m of content.matchAll(emailRegex)) {
    const email = m[0]!.toLowerCase();
    if (!email.endsWith(".png") && !email.endsWith(".jpg") && !email.endsWith(".svg")
      && !email.includes("example.com") && !email.includes("sentry")) {
      emails.add(email);
    }
  }
  for (const m of content.matchAll(mailtoRegex)) {
    if (m[1]) emails.add(m[1].toLowerCase());
  }

  const phoneRegex = /(?:\+?1[-.\\s]?)?\(?\d{3}\)?[-.\\s]?\d{3}[-.\\s]?\d{4}/g;
  const telRegex = /tel:([+\d\-.()\s]{7,})/gi;

  for (const m of content.matchAll(phoneRegex)) {
    const phone = m[0]!.replace(/\s+/g, " ").trim();
    if (phone.replace(/\D/g, "").length >= 10) phones.add(phone);
  }
  for (const m of content.matchAll(telRegex)) {
    if (m[1]) {
      const phone = m[1].trim();
      if (phone.replace(/\D/g, "").length >= 10) phones.add(phone);
    }
  }

  const socialPatterns: { platform: string; regex: RegExp }[] = [
    { platform: "linkedin", regex: /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[a-zA-Z0-9\-._~%]+\/?/gi },
    { platform: "instagram", regex: /https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?/gi },
    { platform: "facebook", regex: /https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9.\-]+\/?/gi },
    { platform: "twitter", regex: /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[a-zA-Z0-9_]+\/?/gi },
  ];
  for (const { platform, regex } of socialPatterns) {
    for (const m of content.matchAll(regex)) {
      const url = m[0]!;
      if (!seenSocials.has(url.toLowerCase())) {
        seenSocials.add(url.toLowerCase());
        socialLinks.push({ platform, url });
      }
    }
  }

  return {
    emails: [...emails].slice(0, 5),
    phones: [...phones].slice(0, 3),
    socialLinks: socialLinks.slice(0, 6),
  };
}

const MAX_RETRIES = 3;


export async function contactNode(state: ResearcherState): Promise<Partial<ResearcherState>> {
  const domain = state.company.domain;

  // 1. Call Hunter.io to get verified emails
  const hunterEmails = await findDomainEmails(domain);
  const personalEmail = hunterEmails.find(e => e.type === "personal" && (e.position?.toLowerCase().includes("ceo") || e.position?.toLowerCase().includes("founder") || e.position?.toLowerCase().includes("owner") || e.position?.toLowerCase().includes("director")));
  const bestHunterEmail = personalEmail || hunterEmails.find(e => e.type === "personal") || hunterEmails[0];

  if (bestHunterEmail) {
    console.log(`[ContactNode] Hunter.io found email: ${bestHunterEmail.value} (${bestHunterEmail.type})`);
  }

  if (!state.scrapedContent) {
    console.log("[ContactNode] No scraped content — skipping LLM contact extraction.");
    if (bestHunterEmail) {
      return {
        contact: {
          ...state.contact,
          email: bestHunterEmail.value,
          name: bestHunterEmail.first_name ? `${bestHunterEmail.first_name} ${bestHunterEmail.last_name || ""}`.trim() : undefined,
          title: bestHunterEmail.position,
          linkedin: bestHunterEmail.linkedin,
          emailSource: "verified"
        }
      };
    }
    return {};
  }

  const hints = extractContactHints(state.scrapedContent);
  if (bestHunterEmail) {
    hints.emails.unshift(bestHunterEmail.value);
  }

  console.log(`[ContactNode] Hints for ${domain}: ${hints.emails.length} emails, ${hints.phones.length} phones, ${hints.socialLinks.length} social links`);

  const prompt = buildContactPrompt(state.scrapedContent, hints, domain);

  let llmContact: any = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const llm = getLLM("smart");
      const response = await llm.invoke([
        { role: "system", content: prompt },
        { role: "user", content: "Extract the contact details now." },
      ]);

      const raw = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
      let cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();

      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        console.error(`[ContactNode] Attempt ${attempt}: Failed to parse JSON`);
        continue;
      }

      const result = ContactOutputSchema.safeParse(parsed);
      if (!result.success) {
        console.error(`[ContactNode] Attempt ${attempt}: Zod validation failed`);
        continue;
      }

      llmContact = result.data;
      console.log(`[ContactNode] LLM extracted: email=${llmContact.email}, guessed=${llmContact.emailGuessed}`);
      break;
    } catch (error: any) {
      console.warn(`[ContactNode] Attempt ${attempt}: API error — ${error?.status ?? "unknown"}`);
      if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }

  // Final fallback — guess email from domain if both Hunter and LLM failed
  const guessedEmail = `info@${domain.replace(/^www\./, "")}`;
  
  // Decide the final email to use (Priority: Hunter.io Personal -> Hunter.io Generic -> LLM Scraped -> Guessed)
  let finalEmail = guessedEmail;
  let finalSource: "verified" | "scraped" | "guessed" = "guessed";
  let finalName = llmContact?.name;
  let finalTitle = llmContact?.title;
  let finalLinkedin = llmContact?.linkedin;

  if (bestHunterEmail) {
    finalEmail = bestHunterEmail.value;
    finalSource = bestHunterEmail.type === "personal" ? "verified" : "scraped"; // treat generic hunter as scraped confidence
    if (bestHunterEmail.first_name) {
      finalName = `${bestHunterEmail.first_name} ${bestHunterEmail.last_name || ""}`.trim();
    }
    if (bestHunterEmail.position) finalTitle = bestHunterEmail.position;
    if (bestHunterEmail.linkedin) finalLinkedin = bestHunterEmail.linkedin;
  } else if (llmContact?.email && !llmContact.emailGuessed) {
    finalEmail = llmContact.email;
    finalSource = "scraped";
  }

  return {
    contact: {
      ...state.contact,
      ...(finalName && { name: finalName }),
      ...(finalTitle && { title: finalTitle }),
      email: finalEmail,
      ...(llmContact?.phone && { phone: llmContact.phone }),
      ...(finalLinkedin && { linkedin: finalLinkedin }),
      emailSource: finalSource,
    },
  };
}

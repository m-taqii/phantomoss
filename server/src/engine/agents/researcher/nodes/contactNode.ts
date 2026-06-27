import type { ResearcherState } from "../state";
import { getLLM } from "../../../../lib/ai";
import { z } from "zod";

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

// ── Zod schema for LLM output ────────────────────────────────────────────────

const ContactOutputSchema = z.object({
  name: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  emailGuessed: z.boolean().default(false),
  phone: z.string().nullable().optional(),
  linkedin: z.string().nullable().optional(),
  instagram: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
});

// ── LLM contact extraction ────────────────────────────────────────────────────

function buildContactPrompt(content: string, hints: ReturnType<typeof extractContactHints>, domain: string): string {
  const hintLines: string[] = [];
  if (hints.emails.length > 0) hintLines.push(`Emails found: ${hints.emails.join(", ")}`);
  if (hints.phones.length > 0) hintLines.push(`Phones found: ${hints.phones.join(", ")}`);
  if (hints.socialLinks.length > 0) {
    for (const s of hints.socialLinks) hintLines.push(`${s.platform}: ${s.url}`);
  }

  return `
<role>
You are a B2B contact intelligence specialist. Your job is to identify the decision-maker (Owner, Founder, CEO, Managing Director) of a business and extract their contact information.
</role>

<task>
Analyze the website content for "${domain}" and return structured contact data.
</task>

${hintLines.length > 0 ? `<pre_extracted_hints>
${hintLines.join("\n")}
</pre_extracted_hints>` : ""}

<website_content>
${content.slice(0, 15000)}
</website_content>

<rules>
- Priority 1: Find the decision-maker's PERSONAL contact (name, email, phone, LinkedIn)
- Priority 2: Fall back to business email (info@, hello@, contact@) from the pre-extracted hints
- Priority 3: GUESS using pattern info@${domain} — set emailGuessed: true
- NEVER return null for email — always use the fallback chain above
- Extract ALL available contact channels (phone, linkedin, instagram, whatsapp)
</rules>

<output_format>
Return ONLY a valid JSON object. No explanation. No markdown.
{"name":null,"title":null,"email":"info@${domain}","emailGuessed":true,"phone":null,"linkedin":null,"instagram":null,"whatsapp":null}
</output_format>`;
}

// ── Node export ───────────────────────────────────────────────────────────────

const MAX_RETRIES = 3;

export async function contactNode(state: ResearcherState): Promise<Partial<ResearcherState>> {
  if (!state.scrapedContent) {
    console.log("[ContactNode] No scraped content — skipping contact extraction.");
    return {};
  }

  const domain = state.company.domain;
  const hints = extractContactHints(state.scrapedContent);

  console.log(`[ContactNode] Hints for ${domain}: ${hints.emails.length} emails, ${hints.phones.length} phones, ${hints.socialLinks.length} social links`);

  const prompt = buildContactPrompt(state.scrapedContent, hints, domain);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const llm = getLLM("fast");
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

      const c = result.data;
      console.log(`[ContactNode] Contact extracted for ${domain}: email=${c.email}, guessed=${c.emailGuessed}`);

      // Merge into existing contact state
      return {
        contact: {
          ...state.contact,
          ...(c.name && { name: c.name }),
          ...(c.title && { title: c.title }),
          ...(c.email && { email: c.email }),
          ...(c.phone && { phone: c.phone }),
          ...(c.linkedin && { linkedin: c.linkedin }),
          emailSource: c.emailGuessed ? "guessed" : "scraped",
        },
      };
    } catch (error: any) {
      console.warn(`[ContactNode] Attempt ${attempt}: API error — ${error?.status ?? "unknown"}`);
      if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }

  // Final fallback — guess email from domain
  const guessedEmail = `info@${domain.replace(/^www\./, "")}`;
  console.warn(`[ContactNode] All attempts failed — falling back to guessed email: ${guessedEmail}`);
  return {
    contact: {
      ...state.contact,
      email: state.contact.email ?? guessedEmail,
      emailSource: "guessed",
    },
  };
}

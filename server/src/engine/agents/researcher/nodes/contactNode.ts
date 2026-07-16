import type { ResearcherState } from "../state";
import { findDomainEmails } from "../../../../services/hunterio.service";

/*
  CONTACT NODE (Researcher Agent)

  Runs after the scrape node. Uses ONLY:
    1. Hunter.io API for verified emails
    2. Regex for pre-extracting emails/phones/social links from scraped content
  
  NO LLM call here — contact extraction is merged into analyzeNode's 
  single LLM call to eliminate the duplicate full-website token cost.
  
  The regex-extracted "hints" are passed through state so the analyzeNode 
  prompt can use them to pick the best decision-maker contact.
*/

// Regex-based pre-extraction (runs on FULL un-truncated content)
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

  const phoneRegex = /(?:\+?1[-.\\\s]?)?\(?\d{3}\)?[-.\\\s]?\d{3}[-.\\\s]?\d{4}/g;
  const telRegex = /tel:([+\d\-.()\\s]{7,})/gi;

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


export async function contactNode(state: ResearcherState): Promise<Partial<ResearcherState>> {
  const domain = state.company.domain;

  // 1. Call Hunter.io to get verified emails
  const hunterEmails = await findDomainEmails(domain);
  const personalEmail = hunterEmails.find(e => e.type === "personal" && (e.position?.toLowerCase().includes("ceo") || e.position?.toLowerCase().includes("founder") || e.position?.toLowerCase().includes("owner") || e.position?.toLowerCase().includes("director")));
  const bestHunterEmail = personalEmail || hunterEmails.find(e => e.type === "personal") || hunterEmails[0];

  if (bestHunterEmail) {
    console.log(`[ContactNode] Hunter.io found email: ${bestHunterEmail.value} (${bestHunterEmail.type})`);
  }

  // 2. Run regex extraction on the full scraped content (un-truncated — catches everything)
  const hints = state.scrapedContent ? extractContactHints(state.scrapedContent) : { emails: [], phones: [], socialLinks: [] };
  if (bestHunterEmail) {
    hints.emails.unshift(bestHunterEmail.value);
  }

  console.log(`[ContactNode] Hints for ${domain}: ${hints.emails.length} emails, ${hints.phones.length} phones, ${hints.socialLinks.length} social links`);

  // 3. Build preliminary contact from Hunter.io + regex (NO LLM call)
  // The LLM will refine this in analyzeNode using the hints we pass through state.
  let finalEmail = `info@${domain.replace(/^www\./, "")}`;
  let finalSource: "verified" | "scraped" | "guessed" = "guessed";
  let finalName = state.contact?.name;
  let finalTitle = state.contact?.title;
  let finalLinkedin = state.contact?.linkedin;

  if (bestHunterEmail) {
    finalEmail = bestHunterEmail.value;
    finalSource = bestHunterEmail.type === "personal" ? "verified" : "scraped";
    if (bestHunterEmail.first_name) {
      finalName = `${bestHunterEmail.first_name} ${bestHunterEmail.last_name || ""}`.trim();
    }
    if (bestHunterEmail.position) finalTitle = bestHunterEmail.position;
    if (bestHunterEmail.linkedin) finalLinkedin = bestHunterEmail.linkedin;
  } else if (hints.emails.length > 0) {
    // Pick the first non-generic email if available
    const nonGeneric = hints.emails.find(e => !e.startsWith("info@") && !e.startsWith("hello@") && !e.startsWith("contact@") && !e.startsWith("support@"));
    if (nonGeneric) {
      finalEmail = nonGeneric;
      finalSource = "scraped";
    } else {
      finalEmail = hints.emails[0]!;
      finalSource = "scraped";
    }
  }

  return {
    contact: {
      ...state.contact,
      ...(finalName && { name: finalName }),
      ...(finalTitle && { title: finalTitle }),
      email: finalEmail,
      ...(hints.phones[0] && { phone: hints.phones[0] }),
      ...(finalLinkedin && { linkedin: finalLinkedin }),
      emailSource: finalSource,
    },
    // Pass hints through state so analyzeNode's merged prompt can use them
    contactHints: {
      emails: hints.emails,
      phones: hints.phones,
      socialLinks: hints.socialLinks,
      hunterVerified: !!bestHunterEmail,
    },
  };
}

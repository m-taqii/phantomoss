import type { ResearcherState } from "../state";
import urlReader from "../../../../services/extractor.service";

/*
  SCRAPE NODE

  Fetches the lead's website content using Jina Reader.
  Discovers and crawls key subpages (about, contact, services, team)
  to build a comprehensive content profile for LLM analysis.
 */

// Character budgets per section — keeps total under LLM token limits
const MAIN_PAGE_CHARS = 5000;
const SUB_PAGE_CHARS = 3000;

/*
 Finds internal subpage links relevant to research from the homepage markdown.
 */
function findResearchableUrls(homepageContent: string, baseUrl: string): string[] {
  const urls: string[] = [];
  try {
    const base = new URL(baseUrl);
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/gi;
    let match;

    const keywords = [
      "about", "services", "team", "contact", "portfolio", "work",
      "clients", "case-stud", "pricing", "solutions", "capabilities",
      "what-we-do", "our-work", "careers", "blog",
    ];

    while ((match = markdownLinkRegex.exec(homepageContent)) !== null) {
      const linkText = (match[1] || "").toLowerCase();
      const linkUrl = (match[2] || "").trim();
      if (!linkUrl) continue;

      // Skip non-navigable links
      if (/^(javascript:|#|mailto:|tel:)/i.test(linkUrl)) continue;

      const lowerUrl = linkUrl.toLowerCase();
      const matchesKeyword = keywords.some(k => linkText.includes(k) || lowerUrl.includes(k));

      if (matchesKeyword) {
        try {
          const absoluteUrl = new URL(linkUrl, base.origin).toString();
          const absoluteBase = new URL(absoluteUrl);
          // Only follow links on the same domain
          const baseHost = base.hostname.replace(/^www\./, "").toLowerCase();
          const targetHost = absoluteBase.hostname.replace(/^www\./, "").toLowerCase();
          if (baseHost === targetHost) {
            urls.push(absoluteUrl);
          }
        } catch {
          // ignore invalid URLs
        }
      }
    }
  } catch (err) {
    console.error("[ScrapeNode] Error finding subpage URLs:", err);
  }
  return Array.from(new Set(urls)).slice(0, 4);
}

export async function scrapeNode(
  state: ResearcherState
): Promise<Partial<ResearcherState>> {
  const website = state.company.website;
  console.log(`[ScrapeNode] Scraping ${website} for lead ${state.leadId}`);

  try {
    // 1. Fetch the main homepage
    const mainContent = await urlReader(website).catch(() => "");
    if (!mainContent || mainContent.trim().length < 100) {
      console.warn(`[ScrapeNode] No usable content from ${website}`);
      return {
        scrapedContent: "",
        scrapedPages: 0,
        error: `Failed to scrape website: ${website}`,
      };
    }

    // 2. Discover researchable subpages
    const subpageUrls = findResearchableUrls(mainContent, website);
    const sections: string[] = [];

    // 3. Main page content
    sections.push(`=== HOMEPAGE: ${website} ===\n${mainContent.slice(0, MAIN_PAGE_CHARS)}`);

    let pagesScraped = 1;

    // 4. Scrape subpages in parallel
    if (subpageUrls.length > 0) {
      console.log(`[ScrapeNode] Found ${subpageUrls.length} subpages for ${website}:`, subpageUrls);
      const subResults = await Promise.all(
        subpageUrls.map(async (subUrl) => {
          try {
            const subContent = await urlReader(subUrl);
            if (subContent && subContent.trim().length > 50) {
              pagesScraped++;
              return `\n=== SUBPAGE: ${subUrl} ===\n${subContent.slice(0, SUB_PAGE_CHARS)}`;
            }
            return "";
          } catch {
            return "";
          }
        })
      );

      const validSubs = subResults.filter((s) => s.length > 0);
      if (validSubs.length > 0) {
        sections.push(validSubs.join("\n"));
      }
    }

    const fullContent = sections.join("\n\n");
    console.log(
      `[ScrapeNode] Scraped ${pagesScraped} page(s), ${fullContent.length} chars for ${state.company.name}`
    );

    return {
      scrapedContent: fullContent,
      scrapedPages: pagesScraped,
      error: null,
    };
  } catch (error: any) {
    console.error(`[ScrapeNode] Error scraping ${website}:`, error.message);
    return {
      scrapedContent: "",
      scrapedPages: 0,
      error: `Scrape failed: ${error.message}`,
    };
  }
}

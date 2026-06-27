import * as cheerio from "cheerio"

export interface DDGResult {
  title: string
  url: string
  snippet: string
  source: "ddg"
}

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
];

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]!;
}

/**
 * Search DuckDuckGo HTML endpoint.
 * @param query  - The search query string
 * @param offset - Pagination offset. DDG paginates in steps of 30 (0, 30, 60, …)
 */
export async function searchDDG(query: string, offset: number = 0): Promise<DDGResult[]> {
  try {
    // DDG paginates using `s` param (multiples of 30) and `dc`
    const body = offset > 0
      ? `q=${encodeURIComponent(query)}&s=${offset}&dc=${offset + 1}&b=&kl=us-en`
      : `q=${encodeURIComponent(query)}&b=&kl=us-en`;

    const res = await fetch("https://html.duckduckgo.com/html/", {
      method: "POST",
      headers: {
        "User-Agent": randomUA(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": "https://html.duckduckgo.com",
        "Referer": "https://html.duckduckgo.com/",
        "Upgrade-Insecure-Requests": "1",
      },
      body,
    });

    if (!res.ok) throw new Error(`DDG returned ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);
    const results: DDGResult[] = [];

    $(".result__body").each((_, el) => {
      const titleEl = $(el).find(".result__title");
      const title   = titleEl.text().trim();
      const url     = titleEl.find("a").attr("href") || "";
      const snippet = $(el).find(".result__snippet").text().trim();

      if (url && title) {
        let cleanUrl = url;
        if (url.includes("uddg=")) {
          const parts = url.split("uddg=");
          if (parts[1]) {
            cleanUrl = decodeURIComponent(parts[1].split("&")[0] || "");
          }
        }
        results.push({ title, url: cleanUrl, snippet, source: "ddg" });
      }
    });

    console.log(`[DDG] Query: "${query}" | Offset: ${offset} | Results: ${results.length}`);
    return results.slice(0, 30); // return up to 30 per page

  } catch (error) {
    console.error("[DDG] Search failed:", error);
    return [];
  }
}

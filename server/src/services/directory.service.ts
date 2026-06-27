import { getBrowser } from "../lib/browser";
import type { Page } from "playwright";

export interface DirectoryResult {
  title: string;
  url: string;
  snippet: string;
  source: "directory";
}

// Generate a random delay between min and max ms to mimic human behavior
function randomDelay(min = 500, max = 1500): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * Searches Yellowpages.com for businesses.
 * @param query e.g. "Plumber"
 * @param location e.g. "Dallas, TX"
 * @param page Pagination page number (starts at 1)
 */
export async function searchYellowpages(
  query: string,
  location: string,
  page: number = 1
): Promise<DirectoryResult[]> {
  const browser = await getBrowser();
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    locale: "en-US",
    timezoneId: "America/New_York",
  });

  // Hide the navigator.webdriver flag
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  const p = await context.newPage();
  
  try {
    // Block heavy assets
    await p.route("**/*", (route) => {
      const type = route.request().resourceType();
      if (["image", "font", "media", "stylesheet"].includes(type)) return route.abort();
      return route.continue();
    });

    const encodedTerm = encodeURIComponent(query);
    const encodedLoc = encodeURIComponent(location);
    const url = `https://www.yellowpages.com/search?search_terms=${encodedTerm}&geo_location_terms=${encodedLoc}&page=${page}`;

    console.log(`[Directory] Searching: ${url}`);
    
    await p.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await randomDelay();

    // Check if there are no results
    const noResults = await p.locator(".no-results").count().catch(() => 0);
    if (noResults > 0) {
      console.log(`[Directory] No results found for page ${page}`);
      return [];
    }

    // Wait for the results container
    await p.waitForSelector(".search-results", { timeout: 10000 }).catch(() => null);
    
    // Extract listing cards
    const results: DirectoryResult[] = [];
    const cards = await p.locator(".result").all();

    for (const card of cards) {
      try {
        const titleEl = card.locator("a.business-name");
        if (!(await titleEl.count())) continue;
        
        const title = await titleEl.textContent();
        if (!title) continue;

        // Try to find website link
        let website = "";
        const webEl = card.locator("a.track-visit-website");
        if (await webEl.count()) {
          website = await webEl.getAttribute("href") || "";
        }

        // Try to find phone or address for the snippet
        let snippet = "";
        const phoneEl = card.locator(".phones");
        if (await phoneEl.count()) {
          snippet += await phoneEl.textContent() + " ";
        }
        
        const addressEl = card.locator(".street-address");
        if (await addressEl.count()) {
          snippet += await addressEl.textContent() + " ";
        }
        
        const localityEl = card.locator(".locality");
        if (await localityEl.count()) {
          snippet += await localityEl.textContent();
        }

        // Only add results that have a website, as the researcher needs it
        if (website && website.startsWith("http")) {
          results.push({
            title: title.trim(),
            url: website.trim(),
            snippet: snippet.trim(),
            source: "directory"
          });
        }
      } catch (err) {
        // skip failed card
      }
    }

    console.log(`[Directory] Page ${page} extracted ${results.length} valid leads with websites`);
    return results;

  } catch (error) {
    console.error("[Directory] Scraping error:", error);
    return [];
  } finally {
    await context.close();
  }
}

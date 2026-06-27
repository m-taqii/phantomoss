import crypto from "crypto";
import { Lead } from "../../../../models/lead.model";
import { Campaign } from "../../../../models/campaign.model";
import type { HunterState } from "../state";

/**
 * Normalizes a raw URL from a search result into a clean website + domain pair.
 * Rejects parked/invalid domains.
 */
function extractDomain(url: string): { website: string; domain: string } | null {
  try {
    // Skip non-HTTP URLs (e.g. news aggregators, DDG-internal links)
    if (!url.startsWith("http")) return null;
    const parsed = new URL(url);
    const domain = parsed.hostname.replace(/^www\./, "").toLowerCase();
    // Reject known junk domains
    const blocklist = ["duckduckgo.com", "google.com", "bing.com", "facebook.com", "twitter.com", "linkedin.com", "wikipedia.org", "reddit.com", "youtube.com"];
    if (blocklist.some(b => domain === b || domain.endsWith(`.${b}`))) return null;
    if (domain.split(".").length < 2) return null;
    const website = `${parsed.protocol}//${parsed.hostname}`;
    return { website, domain };
  } catch {
    return null;
  }
}

function generateFingerprint(domain: string): string {
  return crypto.createHash("md5").update(domain.toLowerCase()).digest("hex");
}

export async function saveNode(state: HunterState): Promise<Partial<HunterState>> {
  try {
    if (!state.rawResults || state.rawResults.length === 0) {
      console.log("[SaveNode] No raw results to save.");
      return {};
    }

    // 1. Parse and deduplicate raw URLs
    const seen = new Set<string>();
    const candidates: Array<{
      website: string;
      domain: string;
      fingerprint: string;
      title: string;
      snippet: string;
      source: "ddg_search" | "google_maps" | "google_search" | "directory";
    }> = [];

    for (const result of state.rawResults) {
      const parsed = extractDomain(result.url);
      if (!parsed) continue;
      if ((state.target.excludeDomains || []).includes(parsed.domain)) continue;
      if (seen.has(parsed.domain)) continue;
      seen.add(parsed.domain);

      const source = result.source === "maps" ? "google_maps" : "ddg_search";
      candidates.push({
        ...parsed,
        fingerprint: generateFingerprint(parsed.domain),
        title: result.title,
        snippet: result.snippet,
        source,
      });
    }

    if (candidates.length === 0) {
      console.log("[SaveNode] All results were duplicates or blocked.");
      return { duplicatesSkipped: state.rawResults.length };
    }

    // 2. Build minimal lead documents — no score, no contact, no research
    const docs = candidates.map(c => ({
      campaignId: state.campaignId,
      status: "discovered",
      source: c.source,
      score: 0,
      fingerprint: c.fingerprint,
      humanApproved: false,
      followUpCount: 0,
      company: {
        name: c.title,
        website: c.website,
        domain: c.domain,
        industry: state.target.industry,
        location: [
          state.target.location?.city,
          state.target.location?.state,
          state.target.location?.country,
        ].filter(Boolean).join(", "),
        description: c.snippet || undefined,
        socialLinks: {},
      },
      contact: {
        emailConfidence: 0,
        emailSource: "guessed" as const,
      },
      research: {
        painPoints: [],
        recentActivity: [],
        techStack: [],
        competitors: [],
        summary: "",
      },
    }));

    // 3. Bulk insert — skip duplicates via the unique fingerprint index
    const result = await Lead.insertMany(docs, { ordered: false }).catch((err: any) => {
      if (err.code === 11000 || err.writeErrors) {
        return { insertedDocs: err.insertedDocs || [] };
      }
      throw err;
    });

    const insertedDocs = Array.isArray(result) ? result : (result as any).insertedDocs || [];
    const saved = insertedDocs.length;
    const duplicates = candidates.length - saved;

    console.log(`[SaveNode] Saved: ${saved} | Duplicates skipped: ${duplicates}`);

    // 4. Persist updated hunterState back to Campaign (offset was already advanced in search node)
    const updateQuery: any = {
      $set: {
        "hunterState.currentOffset": state.currentOffset,
        "hunterState.currentQuery": state.currentQuery,
        "hunterState.currentRegionIndex": state.currentRegionIndex,
        "hunterState.exhaustedRegions": state.exhaustedRegions,
      },
    };

    if (state.queriesUsed && state.queriesUsed.length > 0) {
      updateQuery.$addToSet = {
        "strategy.usedQueries": { $each: state.queriesUsed },
      };
    }

    await Campaign.findByIdAndUpdate(state.campaignId, updateQuery);

    // 5. Immediately enqueue Research jobs for newly saved leads
    if (saved > 0) {
      const researchJobs = insertedDocs.map((doc: any) => ({
        name: "research",
        data: { campaignId: state.campaignId, leadId: doc._id.toString() },
      }));
      const { getQueue } = await import("../../../queue");
      const researchQueue = getQueue("research");
      await researchQueue.addBulk(researchJobs);
      console.log(`[SaveNode] Enqueued ${saved} research jobs to ${researchQueue.name}.`);
    }

    return {
      savedCount: saved,
      duplicatesSkipped: duplicates,
    };
  } catch (error) {
    console.error("[SaveNode] Error:", error);
    return { errors: ["Save node failed"] };
  }
}
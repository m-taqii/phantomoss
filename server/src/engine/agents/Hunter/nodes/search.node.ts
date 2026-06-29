import type { HunterState } from "../state";
import { searchSerper } from "../../../../services/serper.service";

export async function searchNode(state: HunterState): Promise<Partial<HunterState>> {
  try {
    // Pick the next query from the list that hasn't been used yet in this run
    const nextQuery = state.queries.find(q => !state.queriesUsed.includes(q));

    if (!nextQuery) {
      console.log("[SearchNode] No more queries to process signalling done.");
      return { done: true };
    }

    // currentOffset now represents the Serper "page" (1, 2, 3...)
    const page = state.currentOffset ? state.currentOffset : 1;

    // Hard stop pagination at page 10 (1000 results) to prevent infinite loops
    if (page >= 10) {
      console.log(`[SearchNode] Reached max pagination depth (page ${page}) for "${nextQuery}" — marking exhausted.`);
      return {
        queriesUsed: [nextQuery], // mark as fully explored
        currentQuery: undefined,
        queryExhausted: true,
        currentOffset: 1, // reset page for the next query
      };
    }

    console.log(`[SearchNode] Query: "${nextQuery}" | Serper page: ${page}`);

    // Call Serper API
    const results = await searchSerper(nextQuery, page);

    // If Serper returns 0 results, this query is exhausted
    if (results.length === 0) {
      console.log(`[SearchNode] No results from Serper for "${nextQuery}" at page ${page} — marking exhausted.`);
      return {
        queriesUsed: [nextQuery],
        currentQuery: undefined,
        queryExhausted: true,
        currentOffset: 1, 
      };
    }

    console.log(`[SearchNode] Found ${results.length} organic results from Serper`);

    // Advance the page for the NEXT call on the same query
    return {
      rawResults: results.map(r => ({
        title: r.title,
        url: r.link,
        snippet: r.snippet,
        source: "google_search"
      })),
      currentQuery: nextQuery,
      queryExhausted: false,
      currentOffset: page + 1,
    };

  } catch (error) {
    console.error("[SearchNode] Error:", error);
    return {
      queryExhausted: true,
      currentOffset: 1
    };
  }
}
import type { HunterState } from "../state";
import { searchDDG } from "../../../../services/search.service";
import { searchYellowpages } from "../../../../services/directory.service";

// How many DDG pages to advance per run when the current query goes dry
const PAGE_SIZE = 30;

export async function searchNode(state: HunterState): Promise<Partial<HunterState>> {
  try {
    // Pick the next query from the list that hasn't been used yet in this run
    const nextQuery = state.queries.find(q => !state.queriesUsed.includes(q));

    if (!nextQuery) {
      console.log("[SearchNode] No more queries to process signalling done.");
      return { done: true };
    }

    const offset = state.currentOffset ?? 0;
    const directoryPage = Math.floor(offset / PAGE_SIZE) + 1;

    console.log(`[SearchNode] Query: "${nextQuery}" | DDG offset: ${offset} | YP page: ${directoryPage}`);

    // Run DDG and Yellowpages in parallel to maximize discovery
    const [ddgResults, ypResults] = await Promise.all([
      searchDDG(nextQuery, offset),
      searchYellowpages(nextQuery, "", directoryPage), // pass full query to search_terms, let YP parse it
    ]);

    const combinedResults = [...ddgResults, ...ypResults];

    // If BOTH sources return 0 results, this page depth is completely exhausted for this query
    if (combinedResults.length === 0) {
      console.log(`[SearchNode] No results from any source for "${nextQuery}" at offset ${offset} — marking exhausted.`);
      return {
        queriesUsed: [nextQuery], // only mark as used if it's completely dead
        currentQuery: undefined,
        queryExhausted: true,
        currentOffset: 0, // reset offset for the next query
      };
    }

    console.log(`[SearchNode] Found ${ddgResults.length} from DDG, ${ypResults.length} from Yellowpages`);

    // Advance the offset by PAGE_SIZE for the NEXT call on the same query
    // (the evaluate node decides whether to loop back to search on the same query or advance)
    return {
      rawResults: combinedResults,
      currentQuery: nextQuery, // keep it tracked as the active query
      queryExhausted: false,
      currentOffset: offset + PAGE_SIZE,
    };

  } catch (error) {
    console.error("[SearchNode] Error:", error);
    return {
      queryExhausted: true,
      currentOffset: 0
    };
  }
}
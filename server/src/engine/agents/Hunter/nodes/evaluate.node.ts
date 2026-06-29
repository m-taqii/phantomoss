import type { HunterState } from "../state";

/*
  EVALUATE NODE

  Decides whether to:
  1. STOP — we've hit the target lead count OR all queries are exhausted.
  2. CONTINUE SAME QUERY — more pages available (queryExhausted is false).
  3. ADVANCE QUERY — current query is exhausted, move to next one.

  The graph's conditional edge reads the `done` flag.
  If done=false, the graph loops back to search.
*/
export async function evaluateNode(state: HunterState): Promise<Partial<HunterState>> {
  const { savedCount, targetCount, queries, queriesUsed, queryExhausted, done } = state;

  if (done) {
    return { done: true };
  }

  // Target hit — stop hunting
  if (savedCount >= targetCount) {
    console.log(`[EvaluateNode] Target reached — saved: ${savedCount}/${targetCount}. Stopping.`);
    return { done: true };
  }

  // All queries are exhausted — nothing more to search
  const allQueriesUsed = queries.every(q => queriesUsed.includes(q));
  if (allQueriesUsed && queryExhausted) {
    console.log(`[EvaluateNode] All queries exhausted. Stopping. (${savedCount}/${targetCount} saved)`);
    return { done: true };
  }

  // If the last search exhausted the current query's pages, mark it as used
  // so search.node picks the next query on the next iteration.
  if (queryExhausted) {
    console.log(`[EvaluateNode] Query exhausted. Advancing to next query. (${savedCount}/${targetCount} saved)`);
    // search.node already incremented queriesUsed, so next call will pick next query
    return { queryExhausted: false, currentOffset: 1 };
  }

  // Still have pages to paginate on the current query — keep going
  console.log(`[EvaluateNode] Looping — saved: ${savedCount}/${targetCount} | page: ${state.currentOffset}`);
  return {};
}
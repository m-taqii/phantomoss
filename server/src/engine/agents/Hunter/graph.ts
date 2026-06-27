import { START, END, StateGraph } from "@langchain/langgraph";
import { HunterStateAnnotation, type HunterState } from "./state";
import { queryBuilderNode } from "./nodes/queryBuilder.node.ts";
import { searchNode } from "./nodes/search.node.ts";
import { saveNode } from "./nodes/save.node.ts";
import { evaluateNode } from "./nodes/evaluate.node.ts";

/*
  HUNTER GRAPH — Pure Discovery

  Responsibility: Find raw domain URLs and persist them to the DB as `discovered` leads.
  No scraping. No contact extraction. No scoring.

  Pipeline:
    START → queryBuilder → search → save → evaluate → (loop back to search OR END)

  The evaluate node decides:
    - If targetCount reached → END
    - If current query exhausted → reset offset, loop back to search (picks next query)
    - If more pages available → loop back to search with incremented offset
*/

const hunterGraph = new StateGraph(HunterStateAnnotation)
  .addNode("queryBuilder", queryBuilderNode)
  .addNode("search",       searchNode)
  .addNode("save",         saveNode)
  .addNode("evaluate",     evaluateNode)

  .addEdge(START,          "queryBuilder")
  .addEdge("queryBuilder", "search")
  .addEdge("search",       "save")
  .addEdge("save",         "evaluate")
  .addConditionalEdges("evaluate", (state: HunterState) => {
    if (state.done) return END;
    return "search";
  })
  .compile();

export default hunterGraph;
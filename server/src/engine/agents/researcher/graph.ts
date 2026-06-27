import { START, END, StateGraph } from "@langchain/langgraph";
import { ResearcherStateAnnotation } from "./state";
import { scrapeNode } from "./nodes/scrapeNode";
import { contactNode } from "./nodes/contactNode";
import { analyzeNode } from "./nodes/analyzeNode";

/*
  RESEARCHER GRAPH

  Responsibility: Deep-qualify and enrich a single discovered lead.

  Pipeline:
    START → scrape → contact → analyze → END

  1. scrape   — Jina Reader fetches homepage + About/Contact/Team subpages
  2. contact  — Regex + fast LLM extracts decision-maker contact info
  3. analyze  — Smart LLM scores ICP fit, extracts pain points, writes businessBrief
*/

const researcherGraph = new StateGraph(ResearcherStateAnnotation)
  .addNode("scrape",   scrapeNode)
  .addNode("contact",  contactNode)
  .addNode("analyze",  analyzeNode)
  .addEdge(START,      "scrape")
  .addEdge("scrape",   "contact")
  .addEdge("contact",  "analyze")
  .addEdge("analyze",  END)
  .compile();

export default researcherGraph;
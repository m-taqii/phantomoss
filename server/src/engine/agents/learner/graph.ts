import { START, END, StateGraph } from "@langchain/langgraph";
import { LearnerStateAnnotation } from "./state";
import { analyzeNode } from "./nodes/analyze.node.ts";

const learnerGraph = new StateGraph(LearnerStateAnnotation)
  .addNode("analyze", analyzeNode)
  .addEdge(START, "analyze")
  .addEdge("analyze", END)
  .compile();

export default learnerGraph;
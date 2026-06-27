import { START, END, StateGraph } from "@langchain/langgraph";
import { StrategistStateAnnotation } from "./state";
import { strategizeNode } from "./nodes/strategize.node.ts";

const strategistGraph = new StateGraph(StrategistStateAnnotation)
  .addNode("strategize", strategizeNode)
  .addEdge(START, "strategize")
  .addEdge("strategize", END)
  .compile();

export default strategistGraph;

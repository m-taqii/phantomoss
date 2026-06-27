import { END, StateGraph, START } from "@langchain/langgraph";
import { OutreacherStateAnnotation } from "./state";
import draftingNode from "./nodes/draftingNode";
import { ifAutoSend } from "./nodes/conditionalNode";
import sendingNode from "./nodes/sendingNode";
import reviewNode from "./nodes/reviewNode";

const graph = new StateGraph(OutreacherStateAnnotation)
  .addNode("drafting", draftingNode)
  .addNode("sending", sendingNode)
  .addNode("review", reviewNode)
  .addEdge(START, "drafting")
  .addConditionalEdges("drafting", ifAutoSend, {
    sending: "sending",
    review: "review",
  })
  .addEdge("sending", END)
  .addEdge("review", END)
  .compile();

export default graph;
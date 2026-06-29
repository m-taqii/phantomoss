import { START, END, StateGraph } from "@langchain/langgraph";
import { ReplyStateAnnotation } from "./state";
import { replyNode } from "./nodes/replyNode";
import sendingNode from "./nodes/sendingNode";
import optOutNode from "./nodes/optOutNode";

function routeReply(state: typeof ReplyStateAnnotation.State) {
  if (state.intent === "not_interested") {
    return "optOut";
  }
  
  if ((state.intent === "interested" || state.intent === "question") && state.draftReply) {
    if (state.autoSend) {
      return "sending";
    }
  }

  return END;
}

const graph = new StateGraph(ReplyStateAnnotation)
  .addNode("reply", replyNode)
  .addNode("sending", sendingNode)
  .addNode("optOut", optOutNode)
  
  .addEdge(START, "reply")
  .addConditionalEdges("reply", routeReply, {
    optOut: "optOut",
    sending: "sending",
    [END]: END,
  })
  .addEdge("sending", END)
  .addEdge("optOut", END)
  
  .compile();

export default graph;

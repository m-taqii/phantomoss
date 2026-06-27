import { Annotation } from "@langchain/langgraph";

/*
  LEARNER AGENT STATE

  Input:  campaignId
  Output: Structured learning insights saved to the Learning collection
*/

export const LearnerStateAnnotation = Annotation.Root({
  // INPUT
  campaignId: Annotation<string>({
    reducer: (_, b) => b,
  }),

  // OUTPUT — populated by the analyze node
  learningId: Annotation<string | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),

  error: Annotation<string | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),
});

export type LearnerState = typeof LearnerStateAnnotation.State;

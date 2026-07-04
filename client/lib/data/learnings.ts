export interface Learning {
  _id: string;
  campaignId: { _id: string; name: string } | string;
  metrics: {
    totalSent: number;
    totalReplied: number;
    totalBounced: number;
    totalNotInterested: number;
    totalInterested: number;
    totalQuestionsAsked: number;
    replyRate: number;
    positiveRate: number;
  };
  insights: {
    workingAngles: string[];
    failingAngles: string[];
    commonObjections: string[];
    successfulRebuttals: string[];
    icpRefinements: string[];
  };
  sampleReplies: Array<{
    intent: string;
    replySnippet: string;
    ourEmailSnippet: string;
    _id?: string;
  }>;
  generatedAt: string;
  createdAt: string;
}

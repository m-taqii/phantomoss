import { Annotation } from "@langchain/langgraph";

/*
HUNTER AGENT STATE

Responsibility: Pure discovery — find raw domain URLs and save them to the DB.
  - NO scraping, NO contact extraction, NO scoring.
  - Reads hunterState from Campaign to resume where it left off.
  - Supports deep pagination (offset) and region hopping.

Input:  campaign targeting config + hunterState (resume cursor)
Output: savedCount of new raw leads, updated hunterState persisted to Campaign DB
*/

export const HunterStateAnnotation = Annotation.Root({
  // INPUT (set by the worker before invoking the graph)
  campaignId: Annotation<string>({
    reducer: (_, b) => b,
  }),

  // Campaign targeting config
  target: Annotation<{
    industry: string;
    location: { country?: string; state?: string; city?: string };
    keywords: string[];
    companySize?: string;
    excludeDomains?: string[];
  }>({ reducer: (_, b) => b }),

  // Campaign strategy (ICP, search angles, qualification/disqualification criteria)
  strategy: Annotation<{
    icp: {
      idealCompanyProfile: string;
      searchAngles: string[];
      qualificationCriteria: string[];
      disqualifiers: string[];
      knownDirectories: string[];
    };
    targetCities?: string[];
  } | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),

  // How many leads to discover in this run (dailyLimit * 3 - current inventory)
  targetCount: Annotation<number>({
    reducer: (_, b) => b,
    default: () => 90,
  }),

  // HUNTER RESUME STATE (read from campaign.hunterState) 
  // Used to pick up exactly where the last run left off.

  currentRegionIndex: Annotation<number>({
    reducer: (_, b) => b,
    default: () => 0,
  }),

  currentQuery: Annotation<string | undefined>({
    reducer: (_, b) => b,
    default: () => undefined,
  }),

  currentOffset: Annotation<number>({
    reducer: (existing, incoming) => incoming ?? existing,
    default: () => 0,
  }),

  exhaustedRegions: Annotation<string[]>({
    reducer: (_, b) => b,
    default: () => [],
  }),

  // INTERMEDIATE (populated during graph execution) 

  // Generated search queries for this run
  queries: Annotation<string[]>({
    reducer: (_, b) => b,
    default: () => [],
  }),

  queriesUsed: Annotation<string[]>({
    reducer: (existing, incoming) => [...existing, ...incoming],
    default: () => [],
  }),

  // Raw search results from Serper - just URL + title + snippet
  rawResults: Annotation<Array<{
    url: string;
    title: string;
    snippet: string;
    source: "google_search";
  }>>({
    reducer: (existing, incoming) => [...existing, ...incoming],
    default: () => [],
  }),

  // OUTPUT 

  // Number of new raw leads persisted to the DB this run
  savedCount: Annotation<number>({
    reducer: (existing, incoming) => existing + incoming,
    default: () => 0,
  }),

  duplicatesSkipped: Annotation<number>({
    reducer: (existing, incoming) => existing + incoming,
    default: () => 0,
  }),

  // Control flow
  done: Annotation<boolean>({
    reducer: (_, b) => b,
    default: () => false,
  }),

  queryExhausted: Annotation<boolean>({
    reducer: (_, b) => b,
    default: () => false,
  }),

  errors: Annotation<string[]>({
    reducer: (existing, incoming) => [...existing, ...incoming],
    default: () => [],
  }),
});

export type HunterState = typeof HunterStateAnnotation.State;

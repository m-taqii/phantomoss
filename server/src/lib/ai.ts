import { ChatOpenAI } from "@langchain/openai";
import { env } from "./env";

export type AgentMode = "fast" | "smart";

// Default to Qwen
const DEFAULT_BASE_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
const DEFAULT_FAST_MODEL = "qwen3.7-plus";
const DEFAULT_SMART_MODEL = "qwen3.7-max";

export function getLLM(mode: AgentMode = "fast"): ChatOpenAI {
  const baseURL = env.AI_BASE_URL || DEFAULT_BASE_URL;
  
  const fastModel = env.AI_FAST_MODEL || DEFAULT_FAST_MODEL;
  const smartModel = env.AI_SMART_MODEL || DEFAULT_SMART_MODEL;
  const model = mode === "smart" ? smartModel : fastModel;
  
  const apiKey = env.AI_API_KEY || env.QWEN_API_KEY;

  if (!apiKey) {
    throw new Error(
      `[AI Router] Missing API key. Please set AI_API_KEY or QWEN_API_KEY in your .env file.`
    );
  }

  const temperature = mode === "smart" ? 0.7 : 0.3;

  console.log(`[AI Router] ${mode.toUpperCase()} → model: ${model} (baseURL: ${baseURL})`);

  return new ChatOpenAI({
    model,
    apiKey,
    temperature,
    maxRetries: 3,
    maxTokens: 4096,
    configuration: { baseURL },
  });
}

export const availableProviders = ["qwen", "custom"];

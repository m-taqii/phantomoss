import dotenv from "dotenv";
dotenv.config();
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("8080"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),

  // AI Providers (all accessed via their OpenAI-compatible endpoints)
  OPENAI_API_KEY: z.string().optional(),
  QWEN_API_KEY: z.string().optional(),

  // Custom AI Provider Override
  AI_API_KEY: z.string().optional(),
  AI_BASE_URL: z.string().optional(),
  AI_FAST_MODEL: z.string().optional(),
  AI_SMART_MODEL: z.string().optional(),

  // Email
  EMAIL_FROM: z.string().email().optional(),
  IMAP_HOST: z.string().optional(),
  IMAP_PORT: z.string().optional(),
  IMAP_USER: z.string().optional(),
  IMAP_PASS: z.string().optional(),

  // Calendly
  CALENDLY_LINK: z.string().url().optional(),

  // App
  CLIENT_URL: z.string().url().default("http://localhost:3000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
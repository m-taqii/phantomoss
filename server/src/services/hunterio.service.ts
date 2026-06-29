import { env } from "../lib/env";

export interface HunterEmail {
  value: string;
  type: string;
  confidence: number;
  first_name?: string;
  last_name?: string;
  position?: string;
  linkedin?: string;
}

export async function findDomainEmails(domain: string): Promise<HunterEmail[]> {
  if (!env.HUNTER_API_KEY) {
    console.warn("[Hunter.io] HUNTER_API_KEY is missing in .env");
    return [];
  }

  // Clean the domain
  let cleanDomain = domain.toLowerCase().trim();
  if (cleanDomain.startsWith("http://")) cleanDomain = cleanDomain.substring(7);
  if (cleanDomain.startsWith("https://")) cleanDomain = cleanDomain.substring(8);
  if (cleanDomain.startsWith("www.")) cleanDomain = cleanDomain.substring(4);
  cleanDomain = cleanDomain.split("/")[0] || cleanDomain;

  try {
    const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(cleanDomain)}&api_key=${env.HUNTER_API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Hunter.io] API Error: ${response.status} - ${errText}`);
      return [];
    }

    const json = await response.json() as any;
    if (!json.data || !json.data.emails) {
      return [];
    }

    return json.data.emails.map((e: any) => ({
      value: e.value,
      type: e.type,
      confidence: e.confidence,
      first_name: e.first_name,
      last_name: e.last_name,
      position: e.position,
      linkedin: e.linkedin,
    }));
  } catch (error) {
    console.error("[Hunter.io] Network Error:", error);
    return [];
  }
}

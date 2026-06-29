import { env } from "../lib/env";

export interface SerperResult {
  title: string;
  link: string;
  snippet: string;
}

export async function searchSerper(query: string, page: number = 1): Promise<SerperResult[]> {
  if (!env.SERPER_API_KEY) {
    console.error("[Serper] SERPER_API_KEY is missing in .env");
    return [];
  }

  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": env.SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        num: 100,
        page: page,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Serper] API Error: ${response.status} - ${errText}`);
      return [];
    }

    const data = await response.json() as any;
    
    // Ensure we have organic results
    if (!data.organic || !Array.isArray(data.organic)) {
      return [];
    }

    return data.organic.map((item: any) => ({
      title: item.title || "",
      link: item.link || "",
      snippet: item.snippet || "",
    }));
  } catch (error) {
    console.error("[Serper] Network/Parsing Error:", error);
    return [];
  }
}

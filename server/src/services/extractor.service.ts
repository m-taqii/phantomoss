/*
  Strips markdown images and cleans trash content from Jina Reader output.
  Links are preserved here because scrapeNode needs them for subpage discovery.
 */
export default async function urlReader(url: string) {
    const data = await fetch(`https://r.jina.ai/${url}`, {
        headers: {
            "X-Retain-Images": "none"
        }
    });

    let text = await data.text();

    // Strip all markdown images: ![alt](url) -> ""
    text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "");

    return text;
}

/*
  Strips markdown links but keeps the display text: [Click Here](https://...) -> Click Here
  Called AFTER subpage discovery to clean content before sending to LLM.
 */
export function stripMarkdownLinks(text: string): string {
    return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

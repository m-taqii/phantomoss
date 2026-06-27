import { OutreacherStateAnnotation } from "../state";
import { getLLM } from "../../../../lib/ai";
import { drafterPrompt } from "../prompts";
import { EmailSchema } from "../../../../schemas/email.schema";

export default async function draftingNode(state: typeof OutreacherStateAnnotation.State) {

    const llm = getLLM("smart");

    const { company, contact, research, agency } = state;

    let combined = `${drafterPrompt}

--- CONTEXT ---
Lead Details:
- Name: ${company.name}
- Website: ${company.website}
- Industry: ${company.industry}
- Location: ${company.location}

CONTACT:
- Name: ${contact.name}
- Title: ${contact.title}
- Email: ${contact.email}

RESEARCH:
- Pain points: ${research.painPoints.join(", ")}
- Recent activity: ${research.recentActivity.join(", ")}
- Tech stack: ${research.techStack.join(", ")}
- Summary: ${research.summary}

Your Agency Details:
- Name: ${agency.name}
- Services: ${agency.services.join(", ")}
- Unique value: ${agency.uniqueValue}
- Case studies: ${agency.caseStudies.join(", ")}

--- INSTRUCTIONS ---
`;

    if (state.outreachType === "initial") {
        combined += `Write a cold email to ${contact.name} at ${company.name}.`;
    } else {
        combined += `Write a short, polite follow-up email to ${contact.name} at ${company.name}.
Do not just say "bumping this". Use the research context to try a slightly different angle or highlight a different pain point.

PREVIOUS MESSAGE SENT:
${state.previousMessageBody || "(No previous message context available)"}
`;
    }


    const response = await llm.invoke(combined);
    
    const raw = typeof response.content === "string" 
      ? response.content 
      : JSON.stringify(response.content);
      
    let cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    
    let parsed: unknown;
    try {
        parsed = JSON.parse(cleaned);
    } catch {
        throw new Error(`Failed to parse JSON from LLM response: \n\n${raw}`);
    }
    
    const result = EmailSchema.safeParse(parsed);
    if (!result.success) {
        throw new Error(`Email validation failed: ${JSON.stringify(result.error.issues)}`);
    }

    return {
        email: {
            subject: result.data.subject,
            body: result.data.body,
        }
    }
}
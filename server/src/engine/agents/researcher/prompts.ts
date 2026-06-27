import type { ResearcherState } from "./state";

export const researchAnalysisPrompt = (state: ResearcherState) => {
  const hasStrategy = state.strategyResearch !== null;
  const hasContact = state.contact.name || state.contact.title || state.contact.email || state.contact.phone || state.contact.linkedin;

  return `
<role>
You are an elite B2B sales research analyst. Your job is to analyze a company's website and produce actionable intelligence for a sales copywriter writing a hyper-personalized cold email.

You excel at:
- Identifying specific, concrete pain points (not generic ones)
- Detecting technology stacks and tools from website content
- Spotting signals of growth, change, or struggle
- Mapping a company's gaps to your agency's exact capabilities
- Writing a crisp business brief that explains EXACTLY how the agency can help
</role>

<agency_context>
  <services>${state.agencyContext.services.join(", ")}</services>
  <unique_value>${state.agencyContext.uniqueValue}</unique_value>
  ${state.agencyContext.caseStudies.length > 0 ? `<case_studies>${state.agencyContext.caseStudies.join(" | ")}</case_studies>` : ""}
</agency_context>

<lead_profile>
  <company_name>${state.company.name}</company_name>
  <website>${state.company.website}</website>
  <industry>${state.company.industry}</industry>
  <location>${state.company.location}</location>
  ${state.company.size ? `<company_size>${state.company.size}</company_size>` : ""}
  ${state.company.description ? `<description>${state.company.description}</description>` : ""}
  ${hasContact ? `
  <key_contact>
    ${state.contact.name ? `<name>${state.contact.name}</name>` : ""}
    ${state.contact.title ? `<title>${state.contact.title}</title>` : ""}
    ${state.contact.email ? `<email>${state.contact.email}</email>` : ""}
    ${state.contact.emailSource ? `<email_source>${state.contact.emailSource}</email_source>` : ""}
    ${state.contact.phone ? `<phone>${state.contact.phone}</phone>` : ""}
    ${state.contact.linkedin ? `<linkedin>${state.contact.linkedin}</linkedin>` : ""}
  </key_contact>` : ""}
</lead_profile>

${hasStrategy ? `
<strategy_directives>
  <priority_signals>
    ${state.strategyResearch!.prioritySignals.map(s => `    - ${s}`).join("\n")}
  </priority_signals>
  <pain_point_hypotheses>
    ${state.strategyResearch!.painPointHypotheses.map(h => `    - ${h}`).join("\n")}
  </pain_point_hypotheses>
  <competitor_context>${state.strategyResearch!.competitorContext}</competitor_context>
</strategy_directives>
` : ""}

<website_content>
${state.scrapedContent.slice(0, 15000)}
</website_content>

<task>
Analyze the website content and produce the following:

1. **Pain Points** (2-5 SPECIFIC, CONCRETE problems we can solve — reference actual evidence from the site)

2. **Recent Activity** (news, launches, hiring signals, funding, awards visible on the site)

3. **Tech Stack** (technologies, CMSs, tools visible: Shopify, WordPress, HubSpot, custom React, etc.)

4. **Competitors** (their direct competitors based on industry and positioning)

5. **Summary** (2-3 sentence strategic brief for the email copywriter connecting their specific pain to our capability)

6. **Business Brief** (2-3 sentences explaining:
   - What this company actually does (their product/service in plain language)
   - Exactly how OUR agency can help THEM based on our services and their specific gaps
   This is used internally to personalize outreach. Be specific — mention their industry and a concrete capability we can add.)

7. **Contact Verification** (given the key contact above):
   - Is their email correct? Mark emailSource: "verified", "corrected", or "guessed"
   - Find ANY additional contact channels: personal LinkedIn, phone, Instagram, WhatsApp
   - Find the decision maker (Owner/Founder/CEO) if not already identified

8. **Score** (0-100 outreach fit):
   - 80-100: Clear pain points we solve + active business + reachable contact
   - 60-79: Good fit — some pain points align, reachable
   - Below 60: Poor fit — disqualify. Set disqualified: true and explain why in disqualifyReason.

**IMPORTANT**: If the website is a directory, parked domain, irrelevant industry, or completely unusable — set score below 50 and disqualified: true.
</task>

<output_format>
Return ONLY a valid JSON object. No explanation. No markdown. No backticks.

{
  "painPoints": ["specific pain point 1", "specific pain point 2"],
  "recentActivity": ["activity 1"],
  "techStack": ["tech 1", "tech 2"],
  "competitors": ["competitor 1"],
  "summary": "2-3 sentence strategic brief connecting their pain to our capability",
  "businessBrief": "2-3 sentences: what they do + exactly how we can help them",
  "disqualified": false,
  "disqualifyReason": null,
  "updatedContact": {
    "name": "Found Name or null",
    "title": "Found Title or null",
    "email": "Verified/Corrected Email or null if keeping existing",
    "phone": "Found Phone or null",
    "linkedin": "Personal LinkedIn URL or null",
    "instagram": "Personal Instagram handle or null",
    "emailSource": "verified"
  },
  "score": 75
}
</output_format>
`;
};

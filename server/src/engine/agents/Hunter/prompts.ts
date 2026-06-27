export const buildQueriesPrompt = (
  target: {
    industry: string;
    location: { country?: string, state?: string, city?: string };
    keywords: string[];
    companySize?: string;
  },
  strategy?: {
    icp: {
      idealCompanyProfile: string;
      searchAngles: string[];
      qualificationCriteria: string[];
      disqualifiers: string[];
    };
  } | null
) => `
<role>
You are a B2B lead generation expert specializing in finding potential clients for agencies.
</role>

<task>
Generate search queries to find businesses matching the target profile below.
</task>

<target>
  <industry>${target.industry}</industry>
  <location>${[target.location.city, target.location.state, target.location.country].filter(Boolean).join(", ")}</location>
  <keywords>${target.keywords.join(", ")}</keywords>
  ${target.companySize ? `<company_size>${target.companySize}</company_size>` : ""}
</target>

${strategy?.icp ? `
<campaign_strategy>
  <ideal_company_profile>${strategy.icp.idealCompanyProfile}</ideal_company_profile>
  <recommended_search_angles>
${strategy.icp.searchAngles.map(angle => ` - ${angle}`).join("\n")}
  </recommended_search_angles>
</campaign_strategy>
` : ""}

<rules>
  <rule>Every query must include the location</rule>
  <rule>Queries must find actual businesses, not articles or directories</rule>
  <rule>Vary angles — some target the business type, some their services, some pain points</rule>
  ${strategy?.icp ? `<rule>Use the recommended search angles from the campaign strategy to inspire query angles, tailoring them to the location</rule>` : ""}
  <rule>Each query should surface different businesses, not the same ones</rule>
  <rule>Generate exactly 6 queries</rule>
</rules>

<output_format>
Return ONLY a valid JSON array of strings. No explanation. No markdown. No backticks.
["query one", "query two", "query three", "query four", "query five", "query six"]
</output_format>
`

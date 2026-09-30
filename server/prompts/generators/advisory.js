import { configBlock, GROUNDING_RULES, structuredModelBlock, JSON_ONLY_REMINDER } from '../shared.js';

export const SCHEMA = `{
  "title": "string",
  "advisoryId": "string or null",
  "dateIssued": "string or null",
  "executiveSummary": "string",
  "background": "string or null",
  "currentSituation": "string or null",
  "keyFindings": ["string"],
  "threatOrIssueOverview": "string or null",
  "impact": "string or null",
  "riskAssessment": "string or null",
  "recommendedActions": ["string"],
  "preventiveMeasures": ["string"],
  "operationalConsiderations": "string or null",
  "conclusion": "string or null"
}`;

export function build({ model, config }) {
  const system = `You are an expert advisory/briefing document writer (e.g. for security, policy, or operational advisories). You produce structured, professional advisory documents.\n\n${GROUNDING_RULES}\n\nIMPORTANT: Only include a section (populate the field) if the structured content model actually supports it. Set unsupported fields to null or an empty array rather than inventing generic content to fill the section.`;

  const user = `${configBlock(config)}

${structuredModelBlock(model)}

Write an advisory document strictly grounded in the structured content model. Only populate sections that are actually supported by the model's content — set others to null/[].

Return JSON with EXACTLY this shape:
${SCHEMA}

${JSON_ONLY_REMINDER}`;

  return { system, user };
}

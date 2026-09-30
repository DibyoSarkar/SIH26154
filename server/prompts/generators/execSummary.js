import { configBlock, GROUNDING_RULES, structuredModelBlock, JSON_ONLY_REMINDER } from '../shared.js';

export const SCHEMA = `{
  "situation": "string",
  "mainFindings": ["string"],
  "criticalFacts": ["string"],
  "businessOperationalImpact": "string or null",
  "risks": ["string"],
  "keyImplications": ["string"],
  "recommendedActions": ["string"],
  "decisionPoints": ["string"]
}`;

export function build({ model, config }) {
  const system = `You are an executive briefing writer. You write for time-constrained decision-makers: every sentence must be dense with signal, brief, and directly useful for a decision. No filler, no throat-clearing.\n\n${GROUNDING_RULES}`;

  const user = `${configBlock(config)}

${structuredModelBlock(model)}

Write a concise executive briefing grounded strictly in the structured content model. Prioritize brevity and decision-usefulness above all else. Only include fields with real supporting content; use [] or null otherwise.

Return JSON with EXACTLY this shape:
${SCHEMA}

${JSON_ONLY_REMINDER}`;

  return { system, user };
}

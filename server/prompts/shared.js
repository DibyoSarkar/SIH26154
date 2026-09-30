// Shared building blocks reused across every generator prompt so we don't
// duplicate large prompt text per generator (per spec's prompt-architecture
// requirement).

export function configBlock(config) {
  return `
CONFIGURATION (must be respected):
- Target audience: ${config.audience || 'General Public'}
- Tone: ${config.tone || 'Professional'}
- Language: ${config.language || 'English'}
- Level of detail: ${config.detailLevel || 'Medium'}
- Communication objective: ${config.objective || 'Inform'}
- Content style: ${config.contentStyle || 'Corporate'}
${config.customNotes ? `- Additional instructions from user: ${config.customNotes}` : ''}`.trim();
}

export const GROUNDING_RULES = `
GROUNDING RULES (strict, non-negotiable):
- Base every fact, name, date, number, statistic, quote and event ONLY on the structured content model provided below. That model is the single source of truth — do not go back to raw memory or invent details.
- NEVER invent people, organizations, dates, numbers, statistics, events, quotes or claims that are not present in the structured content model.
- If information needed for a section is not available in the structured content model, either omit that section/field, explicitly state the information is unavailable, or clearly label it as a "Recommendation" / "Inference" rather than a fact.
- Do not contradict the structured content model.
- It is better to produce a shorter, fully-grounded output than a longer one with invented details.`.trim();

export function structuredModelBlock(model) {
  return `STRUCTURED CONTENT MODEL (single source of truth — JSON):\n${JSON.stringify(model, null, 2)}`;
}

export const JSON_ONLY_REMINDER = 'Respond with ONLY the JSON object described above. No prose, no markdown fences.';

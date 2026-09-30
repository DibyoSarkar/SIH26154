import { configBlock, GROUNDING_RULES, structuredModelBlock, JSON_ONLY_REMINDER } from '../shared.js';

export const SCHEMA = `{
  "title": "string",
  "coreMessage": "string",
  "keyFacts": ["string"],
  "keyStatistics": [{"value": "string", "label": "string"}],
  "sections": [
    {
      "heading": "string",
      "content": "string - short supporting text for this section",
      "visualSuggestion": "string - icon/chart/illustration idea",
      "highlightedNumber": "string or null"
    }
  ],
  "visualHierarchy": ["string - ordered list describing what should draw the eye first, second, etc."],
  "recommendedLayout": "string - e.g. 'vertical single-column', 'grid of stat cards', 'timeline flow'",
  "iconSuggestions": ["string"],
  "footerSourceInfo": "string or null"
}`;

export function build({ model, config }) {
  const system = `You are an infographic content strategist. You do not design graphics — you produce a complete, structured content specification that a designer or an automated renderer can turn directly into an infographic.\n\n${GROUNDING_RULES}`;

  const user = `${configBlock(config)}

${structuredModelBlock(model)}

Produce a complete infographic content specification grounded strictly in the structured content model. Favor concrete numbers/stats where the model actually contains them; do not invent statistics.

Return JSON with EXACTLY this shape:
${SCHEMA}

${JSON_ONLY_REMINDER}`;

  return { system, user };
}

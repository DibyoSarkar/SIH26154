import { configBlock, GROUNDING_RULES, structuredModelBlock, JSON_ONLY_REMINDER } from '../shared.js';

export const SCHEMA = `{
  "hook": "string - attention-grabbing opening line",
  "body": "string - main post body, written for LinkedIn, may include line breaks as \\n",
  "keyInsights": ["string"],
  "takeaways": ["string"],
  "callToAction": "string",
  "hashtags": ["string - without # symbol"]
}`;

export function build({ model, config }) {
  const system = `You are an expert LinkedIn content writer for organizations. You write publication-ready posts that are professional, credible and engaging — never generic corporate filler.\n\n${GROUNDING_RULES}`;

  const user = `${configBlock(config)}

${structuredModelBlock(model)}

Write a LinkedIn post based strictly on the structured content model above. Requirements:
- Hook must earn attention in the first line without clickbait or exaggeration.
- Body should be scannable (short paragraphs / line breaks), matching the requested tone and detail level.
- keyInsights and takeaways should reflect facts actually present in the model.
- hashtags: 3-6 relevant, professional hashtags (no # symbol, just the word).
- Respect the requested audience, tone, language, detail level, objective, and content style exactly.

Return JSON with EXACTLY this shape:
${SCHEMA}

${JSON_ONLY_REMINDER}`;

  return { system, user };
}

import { configBlock, GROUNDING_RULES, structuredModelBlock, JSON_ONLY_REMINDER } from '../shared.js';

export const SCHEMA = `{
  "format": "single" or "thread",
  "singlePost": "string or null - required if format is 'single', <=280 chars",
  "thread": [
    {"order": 1, "text": "string, <=280 chars"}
  ],
  "conclusion": "string or null - closing line/CTA of the thread, only if format is 'thread'"
}`;

export function build({ model, config }) {
  const system = `You are an expert social media writer for X (Twitter). You write concise, high-signal posts that respect the platform's brevity, and you correctly decide between a single post and a thread based on how much the source material actually warrants.\n\n${GROUNDING_RULES}`;

  const user = `${configBlock(config)}

${structuredModelBlock(model)}

Decide whether this content fits a single X post (<=280 characters) or needs a thread (use a thread only if the source genuinely has enough distinct, important points — do not pad a thread with filler).

If "thread": each entry must have a logical progression (hook -> context -> key points -> conclusion/CTA), each entry <=280 characters, and a final "conclusion" line with a takeaway or call-to-action.
If "single": one punchy, self-contained post <=280 characters.

Return JSON with EXACTLY this shape:
${SCHEMA}

${JSON_ONLY_REMINDER}`;

  return { system, user };
}

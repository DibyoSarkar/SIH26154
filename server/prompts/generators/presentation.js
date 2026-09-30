import { configBlock, GROUNDING_RULES, structuredModelBlock, JSON_ONLY_REMINDER } from '../shared.js';

export const SCHEMA = `{
  "title": "string",
  "subtitle": "string or null",
  "slides": [
    {
      "slideNumber": 1,
      "slideTitle": "string",
      "mainContent": "string - 1-2 sentence framing of the slide",
      "bulletPoints": ["string"],
      "suggestedVisual": "string - chart/image/diagram idea",
      "speakerNotes": "string"
    }
  ]
}`;

export function build({ model, config }) {
  const detailToSlideCount = {
    Concise: '5-6',
    Short: '6-7',
    Medium: '8-10',
    Detailed: '10-13',
    Comprehensive: '13-16',
  };
  const target = detailToSlideCount[config.detailLevel] || '8-10';

  const system = `You are a presentation designer/writer. You structure information into a logical, well-paced slide deck outline — title slide, agenda/context, body slides building an argument, and a closing/next-steps slide. This is a structural outline (title, bullets, speaker notes, visual suggestions) — not full slide graphics.\n\n${GROUNDING_RULES}`;

  const user = `${configBlock(config)}

${structuredModelBlock(model)}

Build a presentation outline strictly grounded in the structured content model, with approximately ${target} slides given the requested detail level. Include a title slide (slideNumber 1) and a closing slide. Each slide's bulletPoints should be scannable, not full paragraphs; speakerNotes can be fuller sentences for the presenter to say aloud.

Return JSON with EXACTLY this shape:
${SCHEMA}

${JSON_ONLY_REMINDER}`;

  return { system, user };
}

import { configBlock, GROUNDING_RULES, structuredModelBlock, JSON_ONLY_REMINDER } from '../shared.js';

export const SCHEMA = `{
  "videoTitle": "string",
  "objective": "string",
  "targetAudience": "string",
  "estimatedDuration": "string - e.g. '90 seconds', '3 minutes'",
  "backgroundMusicStyle": "string or null",
  "scenes": [
    {
      "sceneNumber": 1,
      "description": "string - what happens visually in this scene",
      "visualRecommendation": "string - shot type / imagery / b-roll idea",
      "narration": "string - voiceover script for this scene",
      "onScreenText": "string or null",
      "subtitleText": "string - exact text to appear as subtitles, usually same as narration",
      "transitionToNext": "string or null - e.g. 'quick cut', 'fade'"
    }
  ],
  "closingCallToAction": "string or null"
}`;

export function build({ model, config }) {
  const system = `You are a video producer and scriptwriter who builds complete, shootable/editable video production packages from source material — not a single paragraph called "script". You think in scenes, visuals, narration, on-screen text, and pacing.\n\n${GROUNDING_RULES}\n\nNote: this package is a production specification for a human editor/production tool. No video file is rendered — you are producing the script/storyboard/shot-list.`;

  const user = `${configBlock(config)}

${structuredModelBlock(model)}

Build a complete video production package strictly grounded in the structured content model. Break it into a logical sequence of scenes (typically 4-9 depending on detail level) that together achieve the video's objective, with concrete narration text for every scene (this doubles as the subtitle text unless a shorter on-screen version makes more sense).

Return JSON with EXACTLY this shape:
${SCHEMA}

${JSON_ONLY_REMINDER}`;

  return { system, user };
}

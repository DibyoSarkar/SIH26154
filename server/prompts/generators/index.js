import * as linkedin from './linkedin.js';
import * as x from './x.js';
import * as advisory from './advisory.js';
import * as infographic from './infographic.js';
import * as execSummary from './execSummary.js';
import * as presentation from './presentation.js';
import * as video from './video.js';

// Single registry = adding a new output type later means adding one file +
// one line here. Used by the orchestrator, the frontend output-selection
// cards (via /api/config endpoint), and export service.
export const GENERATORS = {
  linkedin: { label: 'LinkedIn Post', description: 'Professional, publication-ready LinkedIn post.', icon: 'linkedin', ...linkedin },
  x: { label: 'X / Twitter Post', description: 'Single post or thread, platform-optimized.', icon: 'twitter', ...x },
  advisory: { label: 'Advisory', description: 'Structured advisory / briefing document.', icon: 'shield-alert', ...advisory },
  infographic: { label: 'Infographic', description: 'Full content spec for an infographic.', icon: 'bar-chart-2', ...infographic },
  exec_summary: { label: 'Executive Summary', description: 'Concise, decision-focused briefing.', icon: 'file-text', ...execSummary },
  presentation: { label: 'Presentation', description: 'Slide-by-slide outline with speaker notes.', icon: 'presentation', ...presentation },
  video: { label: 'Video Package', description: 'Full script, storyboard & production notes.', icon: 'video', ...video },
};

export const OUTPUT_TYPE_KEYS = Object.keys(GENERATORS);

export function getGenerator(key) {
  const gen = GENERATORS[key];
  if (!gen) throw new Error(`Unknown output type: "${key}"`);
  return gen;
}

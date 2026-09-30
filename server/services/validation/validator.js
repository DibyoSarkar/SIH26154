// Deterministic structural checks that don't require an AI call, run before
// the AI quality-validation call. Cheap, fast, catches the obvious failures
// (empty output, missing required keys) without spending a token.

const REQUIRED_FIELDS = {
  linkedin: ['hook', 'body'],
  x: ['format'],
  advisory: ['title', 'executiveSummary'],
  infographic: ['title', 'coreMessage'],
  exec_summary: ['situation'],
  presentation: ['title', 'slides'],
  video: ['videoTitle', 'scenes'],
};

export function runStructuralChecks(outputType, content) {
  const issues = [];

  if (!content || typeof content !== 'object') {
    return { passed: false, issues: ['Generated content is not a valid object.'] };
  }

  const required = REQUIRED_FIELDS[outputType] || [];
  for (const field of required) {
    const value = content[field];
    const isEmpty =
      value === undefined ||
      value === null ||
      (typeof value === 'string' && !value.trim()) ||
      (Array.isArray(value) && value.length === 0);
    if (isEmpty) issues.push(`Required field "${field}" is missing or empty.`);
  }

  if (outputType === 'presentation' && Array.isArray(content.slides) && content.slides.length === 0) {
    issues.push('Presentation has no slides.');
  }
  if (outputType === 'video' && Array.isArray(content.scenes) && content.scenes.length === 0) {
    issues.push('Video package has no scenes.');
  }
  if (outputType === 'x') {
    if (content.format === 'single' && !content.singlePost) issues.push('format is "single" but singlePost is empty.');
    if (content.format === 'thread' && (!Array.isArray(content.thread) || content.thread.length === 0)) {
      issues.push('format is "thread" but thread array is empty.');
    }
  }

  return { passed: issues.length === 0, issues };
}

/** Merges deterministic + AI-driven validation into one report stored per output. */
export function mergeValidationReports(structural, aiValidation) {
  return {
    passed: structural.passed && aiValidation.passed !== false,
    score: aiValidation.score ?? null,
    structuralIssues: structural.issues,
    checks: aiValidation.checks || {},
    aiIssues: aiValidation.issues || [],
    unsupportedClaims: aiValidation.unsupportedClaims || [],
  };
}

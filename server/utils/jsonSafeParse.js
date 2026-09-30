/**
 * Extracts and parses JSON from a raw LLM text response.
 * Handles the common failure modes: markdown fences, leading/trailing prose,
 * trailing commas. Throws if it truly cannot recover valid JSON.
 */
export function safeParseJSON(raw) {
  if (!raw || typeof raw !== 'string') {
    throw new Error('Empty AI response');
  }

  let text = raw.trim();

  // Strip markdown code fences if present.
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) text = fenceMatch[1].trim();

  // If there's leading/trailing prose, isolate the outermost { ... } or [ ... ]
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');
  let start = -1;
  if (firstBrace === -1) start = firstBracket;
  else if (firstBracket === -1) start = firstBrace;
  else start = Math.min(firstBrace, firstBracket);

  if (start > 0) text = text.slice(start);

  const lastBrace = text.lastIndexOf('}');
  const lastBracket = text.lastIndexOf(']');
  const end = Math.max(lastBrace, lastBracket);
  if (end !== -1 && end < text.length - 1) text = text.slice(0, end + 1);

  try {
    return JSON.parse(text);
  } catch (e1) {
    // Attempt a light repair: remove trailing commas before } or ]
    const repaired = text.replace(/,\s*([}\]])/g, '$1');
    try {
      return JSON.parse(repaired);
    } catch (e2) {
      const err = new Error(`Could not parse AI response as JSON: ${e2.message}`);
      err.rawResponse = raw;
      throw err;
    }
  }
}

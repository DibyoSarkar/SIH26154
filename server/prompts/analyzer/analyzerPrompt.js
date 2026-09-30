export const ANALYZER_SCHEMA_DESCRIPTION = `{
  "title": "string - a concise title for the source material",
  "mainTopic": "string",
  "context": "string - background/situation context",
  "executiveSummary": "string - 2-4 sentences",
  "keyFacts": ["string", "..."],
  "keyMessages": ["string", "..."],
  "entities": {
    "people": [{"name": "string", "role": "string or null"}],
    "organizations": [{"name": "string", "role": "string or null"}],
    "locations": ["string"]
  },
  "dates": [{"date": "string as it appears in source", "description": "string"}],
  "numbersAndStatistics": [{"value": "string", "label": "string"}],
  "events": [{"name": "string", "description": "string", "date": "string or null"}],
  "timeline": [{"when": "string", "what": "string"}],
  "risks": ["string"],
  "impacts": ["string"],
  "recommendations": ["string - only if source contains or clearly implies recommendations"],
  "importantQuotes": [{"quote": "string", "attribution": "string or null"}],
  "sourceDerivedClaims": ["string - factual claims explicitly made in the source"],
  "intendedCommunicationPurpose": "string - what this source seems to be trying to achieve",
  "relevantAudience": "string - who this source appears to be written for",
  "importantTerminology": [{"term": "string", "definition": "string"}],
  "sourceFacts": [{"fact": "string", "sourceSection": "string - short excerpt or section label", "confidence": 0.0}]
}`;

export function buildAnalyzerPrompt({ sourceText, sourceMeta }) {
  const system = `You are a precise content-analysis engine inside a content transformation platform. Your ONLY job is to read source material and produce a structured JSON representation of it. This JSON becomes the single source of truth for every downstream generator (LinkedIn posts, advisories, presentations, etc.), so accuracy and completeness matter more than style.

Rules:
- Extract only what is actually present or clearly, directly implied in the source. Never invent facts, people, organizations, numbers, dates, or quotes.
- If a field has no supporting information in the source, use an empty array [] or null — do not fabricate content to fill it.
- "sourceFacts" should list the most important discrete facts with a short excerpt/location hint and your confidence (0-1) that this is accurately extracted (not a confidence in the fact's real-world truth, just extraction fidelity).
- Be objective. Do not add opinions.
- If the source is very short or thin, it is fine for many fields to be empty — do not pad with generic filler.`;

  const user = `SOURCE METADATA: ${JSON.stringify(sourceMeta || {})}

SOURCE MATERIAL:
"""
${sourceText}
"""

Produce a JSON object with EXACTLY this shape (omit nothing, use [] or null for unavailable data):
${ANALYZER_SCHEMA_DESCRIPTION}

Respond with ONLY the JSON object. No markdown fences, no commentary.`;

  return { system, user };
}

// Used when a document had to be chunked: summarizes/merges partial analyses
// into one consolidated model instead of re-sending the whole raw document.
export function buildConsolidationPrompt({ partialModels }) {
  const system = `You consolidate multiple partial content analyses (each covering one chunk of a longer source document, in order) into a single unified structured content model. Merge and de-duplicate entities, facts, dates, etc. Preserve chronological order where relevant. Do not invent anything beyond what appears in the partial analyses provided.`;

  const user = `PARTIAL ANALYSES (in document order):
${JSON.stringify(partialModels, null, 2)}

Produce ONE consolidated JSON object with exactly this shape:
${ANALYZER_SCHEMA_DESCRIPTION}

Respond with ONLY the JSON object.`;

  return { system, user };
}

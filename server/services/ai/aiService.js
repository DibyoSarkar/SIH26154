import { getAIProvider } from './providerFactory.js';
import { safeParseJSON } from '../../utils/jsonSafeParse.js';
import { needsChunking, chunkText } from '../../utils/chunker.js';
import { buildAnalyzerPrompt, buildConsolidationPrompt } from '../../prompts/analyzer/analyzerPrompt.js';
import { getGenerator } from '../../prompts/generators/index.js';
import { buildValidationPrompt } from '../../prompts/validators/qualityValidator.js';

const MAX_JSON_RETRIES = 2;

/**
 * Calls the provider and guarantees a parsed JSON object back, retrying with
 * an explicit correction message if the first response fails to parse.
 * This implements the spec's "attempt repair -> retry -> validate again ->
 * controlled error" requirement.
 */
async function callForJSON({ system, user, maxTokens = 4000 }) {
  const provider = getAIProvider();
  let lastError;
  let messages = [{ role: 'user', content: user }];

  for (let attempt = 0; attempt <= MAX_JSON_RETRIES; attempt++) {
    let raw;
    try {
      raw = await provider.complete({ system, messages, maxTokens, json: true });
    } catch (e) {
      lastError = e;
      // provider-level failure (network/rate limit/etc) - surface immediately,
      // retrying won't help a hard API error the same way it helps malformed JSON.
      throw e;
    }

    try {
      return safeParseJSON(raw);
    } catch (parseErr) {
      lastError = parseErr;
      messages = [
        { role: 'user', content: user },
        { role: 'assistant', content: raw },
        {
          role: 'user',
          content: `That response was not valid JSON (error: ${parseErr.message}). Reply again with ONLY a single valid JSON object matching the required shape — no markdown, no commentary, no trailing commas.`,
        },
      ];
    }
  }

  const err = new Error(`AI returned malformed JSON after ${MAX_JSON_RETRIES + 1} attempts: ${lastError.message}`);
  err.code = 'AI_INVALID_JSON';
  throw err;
}

/** CALL 1: analyze the (possibly chunked) source into the structured content model. */
export async function analyzeSource({ text, meta }) {
  if (!needsChunking(text)) {
    const { system, user } = buildAnalyzerPrompt({ sourceText: text, sourceMeta: meta });
    return callForJSON({ system, user, maxTokens: 4000 });
  }

  // Long-document handling: chunk, analyze each chunk, consolidate.
  const chunks = chunkText(text);
  const partials = [];
  for (const chunk of chunks) {
    const { system, user } = buildAnalyzerPrompt({ sourceText: chunk, sourceMeta: meta });
    partials.push(await callForJSON({ system, user, maxTokens: 3000 }));
  }
  const { system, user } = buildConsolidationPrompt({ partialModels: partials });
  const consolidated = await callForJSON({ system, user, maxTokens: 4500 });
  consolidated._chunked = true;
  consolidated._chunkCount = chunks.length;
  return consolidated;
}

/** CALL 2+: generate one selected output type from the structured model. */
export async function generateOutput({ outputType, model, config }) {
  const generator = getGenerator(outputType);
  const { system, user } = generator.build({ model, config });
  return callForJSON({ system, user, maxTokens: 4500 });
}

/** Optional validation call: checks a generated output against the model. */
export async function validateOutput({ outputType, generatedContent, model, config }) {
  const { system, user } = buildValidationPrompt({ outputType, generatedContent, model, config });
  try {
    return await callForJSON({ system, user, maxTokens: 1500 });
  } catch (e) {
    // Validation is a quality layer, not a blocking gate — if the validator
    // itself fails, don't fail the whole transformation, just flag it.
    return {
      passed: null,
      score: null,
      checks: {},
      issues: [`Validation call failed: ${e.message}`],
      unsupportedClaims: [],
    };
  }
}

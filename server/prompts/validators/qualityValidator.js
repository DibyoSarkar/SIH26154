export const VALIDATION_SCHEMA = `{
  "passed": true,
  "score": 0.0,
  "checks": {
    "requiredFieldsPresent": true,
    "notEmpty": true,
    "matchesFormat": true,
    "languageMatches": true,
    "toneMatches": true,
    "detailLevelRespected": true,
    "factsConsistentWithModel": true,
    "unsupportedClaimsMinimized": true,
    "noContradictionWithSource": true,
    "usableInFormat": true
  },
  "issues": ["string - short description of any problem found"],
  "unsupportedClaims": ["string - any claim in the output not traceable to the structured model"]
}`;

export function buildValidationPrompt({ outputType, generatedContent, model, config }) {
  const system = `You are a strict quality-assurance reviewer for an AI content transformation platform. You compare a generated output against the structured content model it should be grounded in, and the configuration it should respect. You are looking for hallucinations, missing/empty required content, and mismatches with the requested configuration. Be genuinely critical — do not rubber-stamp.`;

  const user = `OUTPUT TYPE: ${outputType}

CONFIGURATION THE OUTPUT SHOULD RESPECT:
${JSON.stringify(config, null, 2)}

STRUCTURED CONTENT MODEL (ground truth):
${JSON.stringify(model, null, 2)}

GENERATED OUTPUT TO VALIDATE:
${JSON.stringify(generatedContent, null, 2)}

Evaluate the generated output against the checks below. For "factsConsistentWithModel" and "unsupportedClaimsMinimized", specifically look for any name, date, number, statistic, quote or event in the output that does NOT appear in the structured content model above.

Return JSON with EXACTLY this shape:
${VALIDATION_SCHEMA}

Respond with ONLY the JSON object.`;

  return { system, user };
}

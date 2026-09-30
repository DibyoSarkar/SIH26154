import fs from 'fs';
import { db } from '../db/init.js';
import { mimeToSourceType } from '../middleware/upload.js';
import {
  createTransformation,
  runTransformation,
  getTransformation,
  listTransformations,
  generateAndStoreOutput,
} from '../services/transformation/orchestrator.js';
import { exportOutput } from '../services/export/exportService.js';
import { GENERATORS, OUTPUT_TYPE_KEYS } from '../prompts/generators/index.js';

function asyncHandler(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

// GET /api/config — output type catalog + option lists, used by the frontend
// to render output-selector cards and config dropdowns without hardcoding.
export const getConfigOptions = (req, res) => {
  res.json({
    outputTypes: OUTPUT_TYPE_KEYS.map((key) => ({
      key,
      label: GENERATORS[key].label,
      description: GENERATORS[key].description,
      icon: GENERATORS[key].icon,
    })),
    audiences: ['General Public', 'Executives', 'Technical Professionals', 'Developers', 'Security Professionals', 'Policy Makers', 'Students', 'Customers', 'Internal Employees'],
    tones: ['Professional', 'Formal', 'Conversational', 'Technical', 'Educational', 'Persuasive', 'Urgent', 'Neutral'],
    languages: ['English'],
    detailLevels: ['Concise', 'Short', 'Medium', 'Detailed', 'Comprehensive'],
    objectives: ['Inform', 'Educate', 'Persuade', 'Alert', 'Recommend Action', 'Summarize', 'Explain', 'Promote', 'Update'],
    contentStyles: ['Corporate', 'Editorial', 'Technical', 'News-style', 'Social Media', 'Educational', 'Executive', 'Storytelling'],
  });
};

// POST /api/transformations — create + run a transformation in one call.
// Accepts multipart/form-data: optional file, plus text fields.
export const createAndRun = asyncHandler(async (req, res) => {
  const { text, url, title, selectedOutputs, config } = req.body;

  let parsedOutputs, parsedConfig;
  try {
    parsedOutputs = JSON.parse(selectedOutputs);
    parsedConfig = JSON.parse(config);
  } catch {
    return res.status(400).json({ error: 'selectedOutputs and config must be valid JSON.' });
  }

  if (!Array.isArray(parsedOutputs) || parsedOutputs.length === 0) {
    return res.status(400).json({ error: 'Select at least one output type.' });
  }
  for (const key of parsedOutputs) {
    if (!OUTPUT_TYPE_KEYS.includes(key)) return res.status(400).json({ error: `Unknown output type "${key}".` });
  }

  let sourceInput;
  let sourceType;
  let derivedTitle = title;

  if (req.file) {
    sourceType = mimeToSourceType(req.file.mimetype);
    sourceInput = {
      sourceType,
      filePath: req.file.path,
      filename: req.file.originalname,
      mediaType: req.file.mimetype,
    };
    derivedTitle = derivedTitle || req.file.originalname;
  } else if (url && url.trim()) {
    sourceType = 'url';
    sourceInput = { sourceType: 'url', url: url.trim() };
    derivedTitle = derivedTitle || url.trim();
  } else if (text && text.trim()) {
    sourceType = 'text';
    sourceInput = { sourceType: 'text', rawText: text };
    derivedTitle = derivedTitle || text.trim().slice(0, 60) + (text.length > 60 ? '…' : '');
  } else {
    return res.status(400).json({ error: 'Provide source text, a file, or a URL.' });
  }

  const id = createTransformation({
    title: derivedTitle || 'Untitled transformation',
    sourceType,
    selectedOutputs: parsedOutputs,
    config: parsedConfig,
  });

  // Respond immediately with the transformation id/status, then run the
  // pipeline in the background. The DB status column is updated at each
  // real pipeline stage (see orchestrator.js), and the frontend polls
  // GET /transformations/:id to reflect genuine backend progress rather
  // than a fake animated progress bar.
  res.status(202).json(getTransformation(id));

  runTransformation(id, sourceInput)
    .catch((err) => console.error(`[transformation ${id}] failed:`, err.message))
    .finally(() => {
      if (req.file) fs.unlink(req.file.path, () => {});
    });
});

// GET /api/transformations/:id — status + full result (used for polling).
export const getOne = asyncHandler(async (req, res) => {
  const t = getTransformation(req.params.id);
  if (!t) return res.status(404).json({ error: 'Transformation not found.' });
  res.json(t);
});

// GET /api/transformations — history list.
export const listAll = asyncHandler(async (req, res) => {
  res.json(listTransformations());
});

// PATCH /api/outputs/:outputId — save an edited version.
export const updateOutput = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content || typeof content !== 'object') return res.status(400).json({ error: 'content must be an object.' });

  const output = db.prepare('SELECT * FROM outputs WHERE id = ?').get(req.params.outputId);
  if (!output) return res.status(404).json({ error: 'Output not found.' });

  db.prepare('UPDATE outputs SET edited_content = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(JSON.stringify(content), output.id);

  const { v4: uuidv4 } = await import('uuid');
  db.prepare('INSERT INTO output_versions (id, output_id, content, reason) VALUES (?, ?, ?, ?)')
    .run(uuidv4(), output.id, JSON.stringify(content), 'edited');

  const updated = db.prepare('SELECT * FROM outputs WHERE id = ?').get(output.id);
  const { formatOutputRow } = await import('../services/transformation/orchestrator.js');
  res.json(formatOutputRow(updated));
});

// POST /api/outputs/:outputId/reset — discard edits, revert to generated content.
export const resetOutput = asyncHandler(async (req, res) => {
  const output = db.prepare('SELECT * FROM outputs WHERE id = ?').get(req.params.outputId);
  if (!output) return res.status(404).json({ error: 'Output not found.' });
  db.prepare('UPDATE outputs SET edited_content = NULL, updated_at = datetime(\'now\') WHERE id = ?').run(output.id);
  const { formatOutputRow } = await import('../services/transformation/orchestrator.js');
  res.json(formatOutputRow(db.prepare('SELECT * FROM outputs WHERE id = ?').get(output.id)));
});

// POST /api/outputs/:outputId/regenerate — regenerate using original source + model + config.
export const regenerateOutput = asyncHandler(async (req, res) => {
  const output = db.prepare('SELECT * FROM outputs WHERE id = ?').get(req.params.outputId);
  if (!output) return res.status(404).json({ error: 'Output not found.' });

  const transformation = db.prepare('SELECT * FROM transformations WHERE id = ?').get(output.transformation_id);
  if (!transformation || !transformation.structured_model) {
    return res.status(409).json({ error: 'Original structured content model is unavailable for this transformation.' });
  }

  const model = JSON.parse(transformation.structured_model);
  let config = JSON.parse(transformation.config);
  if (req.body?.configOverride) config = { ...config, ...req.body.configOverride };

  const result = await generateAndStoreOutput({
    transformationId: transformation.id,
    outputType: output.output_type,
    model,
    config,
    existingOutputId: output.id,
  });

  const { formatOutputRow } = await import('../services/transformation/orchestrator.js');
  res.json(formatOutputRow(db.prepare('SELECT * FROM outputs WHERE id = ?').get(output.id)));
});

// GET /api/outputs/:outputId/export?format=txt|md|docx|pptx
export const exportOutputHandler = asyncHandler(async (req, res) => {
  const format = req.query.format || 'md';
  const output = db.prepare('SELECT * FROM outputs WHERE id = ?').get(req.params.outputId);
  if (!output) return res.status(404).json({ error: 'Output not found.' });

  const content = output.edited_content ? JSON.parse(output.edited_content) : JSON.parse(output.content);
  const { buffer, mime, ext } = await exportOutput({ outputType: output.output_type, content, format });

  res.setHeader('Content-Type', mime);
  res.setHeader('Content-Disposition', `attachment; filename="${output.output_type}-${output.id.slice(0, 8)}.${ext}"`);
  res.send(buffer);
});

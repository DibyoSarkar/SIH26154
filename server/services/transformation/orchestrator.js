import { v4 as uuidv4 } from 'uuid';
import { db } from '../../db/init.js';
import { extractContent } from '../extraction/extractionService.js';
import { analyzeSource, generateOutput, validateOutput } from '../ai/aiService.js';
import { runStructuralChecks, mergeValidationReports } from '../validation/validator.js';

function setStatus(id, status, error = null) {
  db.prepare('UPDATE transformations SET status = ?, error = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(status, error, id);
}

/**
 * PHASE: create a transformation record in 'idle' state (before processing starts).
 */
export function createTransformation({ title, sourceType, selectedOutputs, config }) {
  const id = uuidv4();
  db.prepare(
    `INSERT INTO transformations (id, user_id, title, source_type, selected_outputs, config, status)
     VALUES (?, 'local-user', ?, ?, ?, ?, 'idle')`
  ).run(id, title, sourceType, JSON.stringify(selectedOutputs), JSON.stringify(config));
  return id;
}

/**
 * Runs the full pipeline end to end for an existing transformation record:
 * extract -> analyze (CALL 1) -> generate each selected output (CALL 2+) -> validate.
 * Progress is persisted to the `status` column at each stage so the frontend
 * can poll and show real progress, not a fake animation.
 */
export async function runTransformation(id, sourceInput) {
  try {
    setStatus(id, 'processing');
    const { text, meta } = await extractContent(sourceInput);

    db.prepare('UPDATE transformations SET source_raw = ?, source_meta = ? WHERE id = ?')
      .run(text, JSON.stringify(meta), id);

    setStatus(id, 'analyzing');
    const model = await analyzeSource({ text, meta });
    db.prepare('UPDATE transformations SET structured_model = ? WHERE id = ?')
      .run(JSON.stringify(model), id);

    const row = db.prepare('SELECT selected_outputs, config FROM transformations WHERE id = ?').get(id);
    const selectedOutputs = JSON.parse(row.selected_outputs);
    const config = JSON.parse(row.config);

    setStatus(id, 'generating');
    for (const outputType of selectedOutputs) {
      await generateAndStoreOutput({ transformationId: id, outputType, model, config });
    }

    setStatus(id, 'completed');
    return { transformationId: id };
  } catch (err) {
    setStatus(id, 'failed', err.message || 'Unknown error');
    throw err;
  }
}

/**
 * Generates one output, runs structural + AI validation, and persists it
 * (used both by the initial run and by "regenerate").
 */
export async function generateAndStoreOutput({ transformationId, outputType, model, config, existingOutputId = null }) {
  const outputId = existingOutputId || uuidv4();

  let content;
  try {
    content = await generateOutput({ outputType, model, config });
  } catch (err) {
    if (existingOutputId) {
      db.prepare('UPDATE outputs SET status = ?, error = ?, updated_at = datetime(\'now\') WHERE id = ?')
        .run('failed', err.message, existingOutputId);
    } else {
      db.prepare(
        `INSERT INTO outputs (id, transformation_id, output_type, content, status, error)
         VALUES (?, ?, ?, '{}', 'failed', ?)`
      ).run(outputId, transformationId, outputType, err.message);
    }
    return { outputId, status: 'failed', error: err.message };
  }

  const structural = runStructuralChecks(outputType, content);
  const aiValidation = await validateOutput({ outputType, generatedContent: content, model, config });
  const validation = mergeValidationReports(structural, aiValidation);

  const now = new Date().toISOString();
  if (existingOutputId) {
    const prev = db.prepare('SELECT version FROM outputs WHERE id = ?').get(existingOutputId);
    const nextVersion = (prev?.version || 1) + 1;
    db.prepare(
      `UPDATE outputs SET content = ?, edited_content = NULL, validation = ?, version = ?, status = 'completed', error = NULL, updated_at = datetime('now')
       WHERE id = ?`
    ).run(JSON.stringify(content), JSON.stringify(validation), nextVersion, existingOutputId);
  } else {
    db.prepare(
      `INSERT INTO outputs (id, transformation_id, output_type, content, validation, version, status)
       VALUES (?, ?, ?, ?, ?, 1, 'completed')`
    ).run(outputId, transformationId, outputType, JSON.stringify(content), JSON.stringify(validation));
  }

  db.prepare(
    `INSERT INTO output_versions (id, output_id, content, reason) VALUES (?, ?, ?, ?)`
  ).run(uuidv4(), outputId, JSON.stringify(content), existingOutputId ? 'regenerated' : 'generated');

  return { outputId, status: 'completed', validation };
}

export function getTransformation(id) {
  const t = db.prepare('SELECT * FROM transformations WHERE id = ?').get(id);
  if (!t) return null;
  const outputs = db.prepare('SELECT * FROM outputs WHERE transformation_id = ? ORDER BY created_at').all(id);
  return {
    ...t,
    selected_outputs: JSON.parse(t.selected_outputs),
    config: JSON.parse(t.config),
    structured_model: t.structured_model ? JSON.parse(t.structured_model) : null,
    source_meta: t.source_meta ? JSON.parse(t.source_meta) : null,
    outputs: outputs.map(formatOutputRow),
  };
}

export function formatOutputRow(o) {
  return {
    id: o.id,
    transformationId: o.transformation_id,
    outputType: o.output_type,
    content: JSON.parse(o.content),
    editedContent: o.edited_content ? JSON.parse(o.edited_content) : null,
    validation: o.validation ? JSON.parse(o.validation) : null,
    version: o.version,
    status: o.status,
    error: o.error,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  };
}

export function listTransformations() {
  const rows = db
    .prepare(
      `SELECT id, title, source_type, selected_outputs, status, created_at, updated_at
       FROM transformations ORDER BY created_at DESC LIMIT 100`
    )
    .all();
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    sourceType: r.source_type,
    selectedOutputs: JSON.parse(r.selected_outputs),
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

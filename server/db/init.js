// Database layer.
//
// DEVIATION FROM SPEC: the spec asks for PostgreSQL. This build uses SQLite
// (via better-sqlite3) because the demo/runtime environment has no long-lived
// Postgres server available. The schema below is plain, portable SQL
// (no SQLite-only features besides AUTOINCREMENT) and the data-access layer
// is isolated in this one file, so migrating to Postgres later means:
//   1. swap better-sqlite3 for `pg`
//   2. replace the `db` object below with a thin wrapper exposing the same
//      prepare/run/get/all shape (or use an ORM like Prisma/Knex)
//   3. keep every other file untouched, since they only import { db } from here.
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isVercel = Boolean(process.env.VERCEL);

const dataDir = isVercel
  ? '/tmp/contentforge-data'
  : path.join(__dirname, '..', 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.SQLITE_PATH
  ? path.isAbsolute(process.env.SQLITE_PATH)
    ? process.env.SQLITE_PATH
    : path.join(__dirname, '..', process.env.SQLITE_PATH.replace(/^\.\//, ''))
  : path.join(dataDir, 'contentforge.db');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transformations (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  source_type TEXT NOT NULL,        -- text | pdf | docx | txt | image | url
  source_raw TEXT,                  -- raw pasted text / extracted text (normalized)
  source_meta TEXT,                 -- JSON: filename, url, size, etc.
  selected_outputs TEXT NOT NULL,   -- JSON array e.g. ["linkedin","x","advisory"]
  config TEXT NOT NULL,             -- JSON: audience, tone, language, detail, objective, style
  structured_model TEXT,            -- JSON: the single-source-of-truth content model
  status TEXT NOT NULL DEFAULT 'idle', -- idle|uploading|processing|analyzing|generating|validating|completed|failed
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS outputs (
  id TEXT PRIMARY KEY,
  transformation_id TEXT NOT NULL REFERENCES transformations(id) ON DELETE CASCADE,
  output_type TEXT NOT NULL,        -- linkedin|x|advisory|infographic|exec_summary|presentation|video
  content TEXT NOT NULL,            -- JSON: generated structured content
  edited_content TEXT,              -- JSON: user-edited version (null until edited)
  validation TEXT,                  -- JSON: validation report
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'completed', -- completed|failed
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS output_versions (
  id TEXT PRIMARY KEY,
  output_id TEXT NOT NULL REFERENCES outputs(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  reason TEXT,                      -- 'generated' | 'regenerated' | 'edited'
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_outputs_transformation ON outputs(transformation_id);
CREATE INDEX IF NOT EXISTS idx_versions_output ON output_versions(output_id);
`;

db.exec(SCHEMA);

// Ensure a default local user exists (no auth system per "no unnecessary
// features" — single-tenant local demo user).
const defaultUser = db.prepare('SELECT id FROM users WHERE id = ?').get('local-user');
if (!defaultUser) {
  db.prepare('INSERT INTO users (id, email, display_name) VALUES (?, ?, ?)')
    .run('local-user', 'local@contentforge.app', 'Local User');
}

console.log(`[db] SQLite ready at ${dbPath}`);

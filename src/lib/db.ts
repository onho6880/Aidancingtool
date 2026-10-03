// Uses Node.js built-in SQLite (Node ≥ 22.5 / Node 24+) — no native compilation needed
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH    = process.env.DB_PATH || './data/db/vidai.db';
const absPath    = path.resolve(process.cwd(), DB_PATH);

fs.mkdirSync(path.dirname(absPath), { recursive: true });

let _db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (_db) return _db;
  _db = new DatabaseSync(absPath);
  _db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  migrate(_db);
  return _db;
}

function migrate(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id           TEXT PRIMARY KEY,
      type         TEXT NOT NULL,
      status       TEXT NOT NULL DEFAULT 'pending',
      provider     TEXT,
      provider_id  TEXT,
      input_data   TEXT NOT NULL,
      output_url   TEXT,
      error_msg    TEXT,
      progress     INTEGER DEFAULT 0,
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_jobs_status  ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_type    ON jobs(type);
    CREATE INDEX IF NOT EXISTS idx_jobs_created ON jobs(created_at DESC);

    CREATE TABLE IF NOT EXISTS uploaded_files (
      id          TEXT PRIMARY KEY,
      filename    TEXT NOT NULL,
      original    TEXT NOT NULL,
      mime_type   TEXT NOT NULL,
      size_bytes  INTEGER NOT NULL,
      path        TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type JobType   = 'motion-copy' | 'image-to-video' | 'clothes-change';

export interface Job {
  id:           string;
  type:         JobType;
  status:       JobStatus;
  provider:     string | null;
  provider_id:  string | null;
  input_data:   string;
  output_url:   string | null;
  error_msg:    string | null;
  progress:     number;
  created_at:   string;
  updated_at:   string;
  completed_at: string | null;
}

export interface UploadedFile {
  id:         string;
  filename:   string;
  original:   string;
  mime_type:  string;
  size_bytes: number;
  path:       string;
  created_at: string;
}

// ── Job queries ─────────────────────────────────────────────────
export const jobQueries = {
  create(db: DatabaseSync, job: Omit<Job, 'created_at' | 'updated_at' | 'completed_at'>) {
    return db.prepare(`
      INSERT INTO jobs (id, type, status, provider, provider_id, input_data, output_url, error_msg, progress)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(job.id, job.type, job.status, job.provider, job.provider_id, job.input_data, job.output_url, job.error_msg, job.progress);
  },

  findById(db: DatabaseSync, id: string): Job | undefined {
    return db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as Job | undefined;
  },

  findPending(db: DatabaseSync): Job[] {
    return db.prepare("SELECT * FROM jobs WHERE status = 'pending' ORDER BY created_at ASC LIMIT 5").all() as unknown as Job[];
  },

  list(db: DatabaseSync, limit = 50, offset = 0): Job[] {
    return db.prepare('SELECT * FROM jobs ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset) as unknown as Job[];
  },

  updateStatus(db: DatabaseSync, id: string, status: JobStatus, extra: Partial<Job> = {}) {
    const sets: string[] = ['status = ?', "updated_at = datetime('now')"];
    const vals: unknown[] = [status];

    if (extra.output_url  !== undefined) { sets.push('output_url  = ?'); vals.push(extra.output_url); }
    if (extra.error_msg   !== undefined) { sets.push('error_msg   = ?'); vals.push(extra.error_msg); }
    if (extra.progress    !== undefined) { sets.push('progress    = ?'); vals.push(extra.progress); }
    if (extra.provider    !== undefined) { sets.push('provider    = ?'); vals.push(extra.provider); }
    if (extra.provider_id !== undefined) { sets.push('provider_id = ?'); vals.push(extra.provider_id); }
    if (status === 'completed' || status === 'failed') {
      sets.push("completed_at = datetime('now')");
    }
    vals.push(id);
    return db.prepare(`UPDATE jobs SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  },

  count(db: DatabaseSync) {
    return db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status='pending'    THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status='processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status='completed'  THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status='failed'     THEN 1 ELSE 0 END) as failed
      FROM jobs
    `).get() as { total: number; pending: number; processing: number; completed: number; failed: number };
  },
};

// ── Upload file queries ──────────────────────────────────────────
export const fileQueries = {
  create(db: DatabaseSync, file: Omit<UploadedFile, 'created_at'>) {
    return db.prepare(`
      INSERT INTO uploaded_files (id, filename, original, mime_type, size_bytes, path)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(file.id, file.filename, file.original, file.mime_type, file.size_bytes, file.path);
  },

  findById(db: DatabaseSync, id: string): UploadedFile | undefined {
    return db.prepare('SELECT * FROM uploaded_files WHERE id = ?').get(id) as UploadedFile | undefined;
  },
};

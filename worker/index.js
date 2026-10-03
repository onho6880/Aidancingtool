/**
 * VidAI Studio — Background Job Worker
 * Uses Node.js built-in SQLite (node:sqlite, Node ≥ 22.5)
 * Runs as a separate PM2 process. Polls DB for pending jobs and processes via AI providers.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const path     = require('path');
const fs       = require('fs');
const { v4: uuidv4 } = require('uuid');

// Node.js built-in SQLite (Node 22.5+)
const { DatabaseSync } = require('node:sqlite');

// ── Config ──────────────────────────────────────────────────────
const POLL_INTERVAL  = parseInt(process.env.WORKER_POLL_INTERVAL_MS || '5000', 10);
const MAX_CONCURRENT = parseInt(process.env.WORKER_MAX_CONCURRENT   || '2', 10);
const JOB_TIMEOUT_MS = parseInt(process.env.JOB_TIMEOUT_MINUTES     || '30', 10) * 60 * 1000;
const DB_PATH        = path.resolve(process.cwd(), process.env.DB_PATH || './data/db/vidai.db');
const RESULTS_DIR    = path.resolve(process.cwd(), process.env.RESULTS_DIR || './data/results');

fs.mkdirSync(RESULTS_DIR, { recursive: true });
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// ── Database ────────────────────────────────────────────────────
let db;
function getDb() {
  if (db) return db;
  db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  return db;
}

// ── Replicate provider (inline, no TS compilation needed) ───────
class ReplicateProvider {
  constructor() {
    this.name = 'replicate';
    const Replicate = require('replicate');
    this.client = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  }

  async motionCopy(input) {
    const model = process.env.REPLICATE_MODEL_MOTION_COPY || 'lucataco/animate-anyone';
    return this._run(model, {
      ref_image:    input.characterImageUrl,
      motion_video: input.motionVideoUrl,
      prompt:       input.prompt || 'A person dancing',
    });
  }

  async imageToVideo(input) {
    const model = process.env.REPLICATE_MODEL_IMAGE_TO_VIDEO
      || 'stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438';
    return this._run(model, {
      image:            input.imageUrl,
      prompt:           input.prompt,
      video_length:     input.duration || 14,
      fps:              24,
      motion_bucket_id: 127,
      cond_aug:         0.02,
    });
  }

  async clothesChange(input) {
    const model = process.env.REPLICATE_MODEL_CLOTHES_CHANGE
      || 'cuuupid/idm-vton:906425dbfd0b17b9df6ea3fcef058433cbaeefa7d24c37d0e5ab63b99de4b668';
    return this._run(model, {
      human_img:     input.modelImageUrl,
      garm_img:      input.garmentImageUrl,
      garment_des:   'clothing item',
      is_checked:    true,
      denoise_steps: 30,
      seed:          42,
    });
  }

  async _run(model, modelInput) {
    const opts = {};
    if (model.includes(':')) { opts.version = model.split(':')[1]; }
    else                     { opts.model   = model; }
    const pred = await this.client.predictions.create({ ...opts, input: modelInput });
    return this._map(pred);
  }

  async pollResult(providerJobId) {
    const pred = await this.client.predictions.get(providerJobId);
    return this._map(pred);
  }

  _map(pred) {
    return {
      providerJobId: pred.id,
      status:        pred.status === 'succeeded' ? 'completed'
                   : pred.status === 'failed'    ? 'failed'
                   : 'processing',
      outputUrl:     Array.isArray(pred.output) ? pred.output[0] : (pred.output || null),
      error:         pred.error ? String(pred.error) : undefined,
    };
  }
}

function getProvider(jobType) {
  const envKey = {
    'motion-copy':    'AI_PROVIDER_MOTION_COPY',
    'image-to-video': 'AI_PROVIDER_IMAGE_TO_VIDEO',
    'clothes-change': 'AI_PROVIDER_CLOTHES_CHANGE',
  }[jobType];

  const providerName = (process.env[envKey] || 'replicate').toLowerCase();
  if (providerName === 'replicate') return new ReplicateProvider();
  throw new Error(`Provider "${providerName}" not yet implemented in worker. Use REPLICATE.`);
}

// ── Job processing ──────────────────────────────────────────────
const active = new Set();

async function processJob(job) {
  const database = getDb();
  console.log(`[worker] Job ${job.id} | type=${job.type} | provider=${job.provider}`);

  database.prepare("UPDATE jobs SET status='processing', updated_at=datetime('now') WHERE id=?").run(job.id);

  try {
    const input    = JSON.parse(job.input_data);
    const provider = getProvider(job.type);

    let result;
    if (job.type === 'motion-copy')    result = await provider.motionCopy(input);
    if (job.type === 'image-to-video') result = await provider.imageToVideo(input);
    if (job.type === 'clothes-change') result = await provider.clothesChange(input);
    if (!result) throw new Error('Provider returned no result');

    // Save provider job ID for reference
    database.prepare("UPDATE jobs SET provider_id=?, updated_at=datetime('now') WHERE id=?")
      .run(result.providerJobId, job.id);

    // Poll until terminal state
    const deadline = Date.now() + JOB_TIMEOUT_MS;
    while (result.status === 'processing') {
      if (Date.now() > deadline) throw new Error('Job timed out after ' + JOB_TIMEOUT_MS / 60000 + ' minutes');
      await sleep(4000);
      result = await provider.pollResult(result.providerJobId);
    }

    if (result.status === 'failed') throw new Error(result.error || 'AI provider returned failure');

    // Download & store result locally
    let outputUrl = result.outputUrl;
    if (outputUrl && outputUrl.startsWith('http')) {
      try { outputUrl = await downloadResult(outputUrl, job.type); }
      catch (e) { console.warn('[worker] Download failed, using remote URL:', e.message); }
    }

    database.prepare(`
      UPDATE jobs SET status='completed', output_url=?, progress=100,
        completed_at=datetime('now'), updated_at=datetime('now')
      WHERE id=?
    `).run(outputUrl, job.id);

    console.log(`[worker] DONE ${job.id} → ${outputUrl}`);

  } catch (err) {
    console.error(`[worker] FAIL ${job.id}:`, err.message);
    database.prepare(`
      UPDATE jobs SET status='failed', error_msg=?,
        completed_at=datetime('now'), updated_at=datetime('now')
      WHERE id=?
    `).run(err.message, job.id);
  } finally {
    active.delete(job.id);
  }
}

async function downloadResult(url, jobType) {
  const ext      = jobType === 'clothes-change' ? '.jpg' : '.mp4';
  const filename = `${uuidv4()}${ext}`;
  const dest     = path.join(RESULTS_DIR, filename);
  const res      = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return `/api/files/result/${filename}`;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Polling loop ────────────────────────────────────────────────
async function tick() {
  if (active.size >= MAX_CONCURRENT) return;
  const database = getDb();
  const slots    = MAX_CONCURRENT - active.size;
  const pending  = database.prepare(
    "SELECT * FROM jobs WHERE status='pending' ORDER BY created_at ASC LIMIT ?"
  ).all(slots);

  for (const job of pending) {
    active.add(job.id);
    processJob(job); // intentionally not awaited
  }
}

// Reset any jobs stuck in 'processing' from a previous crashed run
function resetStuck() {
  const n = getDb().prepare(
    "UPDATE jobs SET status='pending', updated_at=datetime('now') WHERE status='processing'"
  ).run().changes;
  if (n > 0) console.log(`[worker] Reset ${n} stuck job(s)`);
}

resetStuck();
console.log(`[worker] Started | poll=${POLL_INTERVAL}ms | concurrent=${MAX_CONCURRENT}`);
tick();
setInterval(tick, POLL_INTERVAL);

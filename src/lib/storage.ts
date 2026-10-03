import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR  = path.resolve(process.cwd(), process.env.UPLOAD_DIR  || './data/uploads');
const RESULTS_DIR = path.resolve(process.cwd(), process.env.RESULTS_DIR || './data/results');
const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '100', 10);

// Ensure directories exist at startup
[UPLOAD_DIR, RESULTS_DIR].forEach(dir => fs.mkdirSync(dir, { recursive: true }));

export function getUploadDir()  { return UPLOAD_DIR; }
export function getResultsDir() { return RESULTS_DIR; }
export function getMaxSizeBytes() { return MAX_SIZE_MB * 1024 * 1024; }

export function getUploadPath(filename: string)  { return path.join(UPLOAD_DIR, filename); }
export function getResultPath(filename: string)  { return path.join(RESULTS_DIR, filename); }

export function generateFilename(originalName: string): { id: string; filename: string } {
  const id  = uuidv4();
  const ext = path.extname(originalName).toLowerCase();
  return { id, filename: `${id}${ext}` };
}

export async function saveUpload(buffer: Buffer, originalName: string): Promise<{ id: string; filename: string; path: string }> {
  const { id, filename } = generateFilename(originalName);
  const filePath = path.join(UPLOAD_DIR, filename);
  await fs.promises.writeFile(filePath, buffer);
  return { id, filename, path: filePath };
}

export async function saveResult(buffer: Buffer, ext: string): Promise<{ filename: string; path: string }> {
  const filename = `${uuidv4()}${ext}`;
  const filePath = path.join(RESULTS_DIR, filename);
  await fs.promises.writeFile(filePath, buffer);
  return { filename, path: filePath };
}

export function deleteFile(filePath: string): void {
  try { fs.unlinkSync(filePath); } catch { /* ignore */ }
}

export function fileExists(filePath: string): boolean {
  try { return fs.existsSync(filePath); } catch { return false; }
}

export function getPublicUrl(type: 'upload' | 'result', filename: string): string {
  return `/api/files/${type}/${filename}`;
}

// Download a remote URL and save as result
export async function downloadToResults(url: string, ext: string = '.mp4'): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);

  const buffer = Buffer.from(await response.arrayBuffer());
  const { filename } = await saveResult(buffer, ext);
  return getPublicUrl('result', filename);
}

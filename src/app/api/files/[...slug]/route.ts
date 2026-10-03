import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import mime from 'mime-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DIR_MAP: Record<string, string> = {
  upload: process.env.UPLOAD_DIR  || './data/uploads',
  result: process.env.RESULTS_DIR || './data/results',
};

export async function GET(_req: NextRequest, { params }: { params: { slug: string[] } }) {
  const [type, ...rest] = params.slug;
  const baseDir = DIR_MAP[type];

  if (!baseDir) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  const filename = rest.join('/');

  // Security: prevent path traversal
  if (filename.includes('..') || filename.includes('\0')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const absoluteBase = path.resolve(process.cwd(), baseDir);
  const filePath     = path.join(absoluteBase, filename);

  // Ensure file is inside the allowed directory
  if (!filePath.startsWith(absoluteBase + path.sep) && filePath !== absoluteBase) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const stat     = fs.statSync(filePath);
  const mimeType = mime.lookup(filePath) || 'application/octet-stream';
  const buffer   = fs.readFileSync(filePath);

  return new NextResponse(buffer, {
    headers: {
      'Content-Type':        mimeType,
      'Content-Length':      String(stat.size),
      'Cache-Control':       'public, max-age=86400',
      'Content-Disposition': `inline; filename="${path.basename(filePath)}"`,
    },
  });
}

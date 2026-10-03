import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { getDb, fileQueries } from '@/lib/db';
import { getUploadDir, getPublicUrl, getMaxSizeBytes } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/avi'];
const ALLOWED_TYPES       = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

export async function POST(req: NextRequest) {
  try {
    const formData  = await req.formData();
    const file      = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy file' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: `Định dạng không hỗ trợ. Chấp nhận: JPEG, PNG, WebP, MP4, MOV, WebM`,
      }, { status: 400 });
    }

    if (file.size > getMaxSizeBytes()) {
      return NextResponse.json({
        error: `File quá lớn. Giới hạn: ${process.env.MAX_FILE_SIZE_MB || 100}MB`,
      }, { status: 400 });
    }

    const id       = uuidv4();
    const ext      = path.extname(file.name).toLowerCase() || (file.type.includes('video') ? '.mp4' : '.jpg');
    const filename = `${id}${ext}`;
    const destPath = path.join(getUploadDir(), filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.promises.writeFile(destPath, buffer);

    const db = getDb();
    fileQueries.create(db, {
      id,
      filename,
      original:   file.name,
      mime_type:  file.type,
      size_bytes: file.size,
      path:       destPath,
    });

    return NextResponse.json({
      id,
      url:      getPublicUrl('upload', filename),
      filename,
      original: file.name,
      type:     file.type,
      size:     file.size,
    });
  } catch (err) {
    console.error('[upload] error:', err);
    return NextResponse.json({ error: 'Lỗi khi tải file lên' }, { status: 500 });
  }
}

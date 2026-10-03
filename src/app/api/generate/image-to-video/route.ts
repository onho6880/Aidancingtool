import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb, jobQueries } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      imageUrl:  string;
      prompt:    string;
      duration?: number;
    };

    if (!body.imageUrl || !body.prompt?.trim()) {
      return NextResponse.json({
        error: 'Cần cung cấp imageUrl và prompt',
      }, { status: 400 });
    }

    const id = uuidv4();
    const db = getDb();

    jobQueries.create(db, {
      id,
      type:       'image-to-video',
      status:     'pending',
      provider:   process.env.AI_PROVIDER_IMAGE_TO_VIDEO || 'replicate',
      provider_id: null,
      input_data: JSON.stringify({
        imageUrl:  body.imageUrl,
        prompt:    body.prompt.trim(),
        duration:  body.duration || 5,
      }),
      output_url: null,
      error_msg:  null,
      progress:   0,
    });

    return NextResponse.json({ id, status: 'pending' }, { status: 202 });
  } catch (err) {
    console.error('[generate/image-to-video] error:', err);
    return NextResponse.json({ error: 'Không thể tạo job' }, { status: 500 });
  }
}

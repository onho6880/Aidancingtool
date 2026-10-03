import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb, jobQueries } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      characterImageUrl: string;
      motionVideoUrl:    string;
      prompt?:           string;
    };

    if (!body.characterImageUrl || !body.motionVideoUrl) {
      return NextResponse.json({
        error: 'Cần cung cấp characterImageUrl và motionVideoUrl',
      }, { status: 400 });
    }

    const id = uuidv4();
    const db = getDb();

    jobQueries.create(db, {
      id,
      type:        'motion-copy',
      status:      'pending',
      provider:    process.env.AI_PROVIDER_MOTION_COPY || 'replicate',
      provider_id:  null,
      input_data:  JSON.stringify({
        characterImageUrl: body.characterImageUrl,
        motionVideoUrl:    body.motionVideoUrl,
        prompt:            body.prompt || '',
      }),
      output_url:  null,
      error_msg:   null,
      progress:    0,
    });

    return NextResponse.json({ id, status: 'pending' }, { status: 202 });
  } catch (err) {
    console.error('[generate/motion-copy] error:', err);
    return NextResponse.json({ error: 'Không thể tạo job' }, { status: 500 });
  }
}

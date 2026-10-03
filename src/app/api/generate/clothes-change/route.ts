import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb, jobQueries } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      modelImageUrl:   string;
      garmentImageUrl: string;
    };

    if (!body.modelImageUrl || !body.garmentImageUrl) {
      return NextResponse.json({
        error: 'Cần cung cấp modelImageUrl và garmentImageUrl',
      }, { status: 400 });
    }

    const id = uuidv4();
    const db = getDb();

    jobQueries.create(db, {
      id,
      type:       'clothes-change',
      status:     'pending',
      provider:   process.env.AI_PROVIDER_CLOTHES_CHANGE || 'replicate',
      provider_id: null,
      input_data: JSON.stringify({
        modelImageUrl:   body.modelImageUrl,
        garmentImageUrl: body.garmentImageUrl,
      }),
      output_url: null,
      error_msg:  null,
      progress:   0,
    });

    return NextResponse.json({ id, status: 'pending' }, { status: 202 });
  } catch (err) {
    console.error('[generate/clothes-change] error:', err);
    return NextResponse.json({ error: 'Không thể tạo job' }, { status: 500 });
  }
}

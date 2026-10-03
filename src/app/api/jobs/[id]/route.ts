import { NextRequest, NextResponse } from 'next/server';
import { getDb, jobQueries } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db  = getDb();
    const job = jobQueries.findById(db, params.id);

    if (!job) {
      return NextResponse.json({ error: 'Không tìm thấy job' }, { status: 404 });
    }

    return NextResponse.json({
      ...job,
      input_data: safeParseJson(job.input_data),
    });
  } catch (err) {
    console.error('[job/:id GET] error:', err);
    return NextResponse.json({ error: 'Không thể tải job' }, { status: 500 });
  }
}

function safeParseJson(str: string) {
  try { return JSON.parse(str); } catch { return {}; }
}

import { NextRequest, NextResponse } from 'next/server';
import { getDb, jobQueries } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit  = Math.min(parseInt(searchParams.get('limit')  || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const db   = getDb();
    const jobs  = jobQueries.list(db, limit, offset);
    const stats = jobQueries.count(db);

    const enriched = jobs.map(j => ({
      ...j,
      input_data: safeParseJson(j.input_data),
    }));

    return NextResponse.json({ jobs: enriched, stats, limit, offset });
  } catch (err) {
    console.error('[jobs GET] error:', err);
    return NextResponse.json({ error: 'Không thể tải danh sách jobs' }, { status: 500 });
  }
}

function safeParseJson(str: string) {
  try { return JSON.parse(str); } catch { return {}; }
}

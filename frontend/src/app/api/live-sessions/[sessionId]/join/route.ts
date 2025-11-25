import { NextRequest, NextResponse } from 'next/server';
import { join } from '../../_store';

export async function POST(_req: NextRequest, { params }: { params: { sessionId: string } }) {
  const url = join(String(params.sessionId));
  if (!url) return NextResponse.json({ error: 'not_available' }, { status: 404 });
  return NextResponse.json({ meetingUrl: url });
}
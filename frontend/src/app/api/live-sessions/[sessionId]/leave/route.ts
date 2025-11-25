import { NextRequest, NextResponse } from 'next/server';
import { leave } from '../../_store';

export async function POST(_req: NextRequest, { params }: { params: { sessionId: string } }) {
  const ok = leave(String(params.sessionId));
  return NextResponse.json({ success: ok });
}
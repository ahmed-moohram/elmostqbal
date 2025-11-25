import { NextRequest, NextResponse } from 'next/server';
import { cancel } from '../../_store';

export async function POST(_req: NextRequest, { params }: { params: { sessionId: string } }) {
  const ok = cancel(String(params.sessionId));
  return NextResponse.json({ success: ok });
}
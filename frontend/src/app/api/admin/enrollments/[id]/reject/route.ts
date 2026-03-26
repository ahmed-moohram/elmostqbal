import { NextRequest, NextResponse } from 'next/server';
import { rejectEnrollment } from '../../_store';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const ok = rejectEnrollment(String(params.id));
  if (!ok) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
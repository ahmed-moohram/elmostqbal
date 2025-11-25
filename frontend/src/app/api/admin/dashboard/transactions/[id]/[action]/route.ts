import { NextRequest, NextResponse } from 'next/server';
import { updateTransaction } from '../../../_store';

export async function PUT(_req: NextRequest, { params }: { params: { id: string; action: string } }) {
  const action = params.action === 'approve' ? 'approve' : params.action === 'decline' ? 'decline' : null;
  if (!action) return NextResponse.json({ error: 'invalid_action' }, { status: 400 });
  const ok = updateTransaction(String(params.id), action);
  if (!ok) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
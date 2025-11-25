import { NextRequest, NextResponse } from 'next/server';
import { getCert } from '../../_store';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const cert = getCert(String(params.id));
  if (!cert) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ url: `/downloads/${cert._id}.pdf` });
}
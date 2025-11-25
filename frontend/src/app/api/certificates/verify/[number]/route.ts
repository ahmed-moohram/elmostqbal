import { NextRequest, NextResponse } from 'next/server';
import { verifyCert } from '../../_store';

export async function GET(_req: NextRequest, { params }: { params: { number: string } }) {
  const ok = verifyCert(String(params.number));
  return NextResponse.json({ valid: ok });
}
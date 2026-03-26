import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok', limited: false, limit: 100, remaining: 100, windowMs: 60000 });
}
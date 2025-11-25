import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ p95: 120, p99: 250, reqPerMin: 200, ts: Date.now() });
}

export async function POST(request: NextRequest) {
  await request.json();
  return NextResponse.json({ success: true });
}
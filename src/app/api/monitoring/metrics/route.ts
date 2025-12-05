import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ cpu: Math.random(), memory: Math.random(), network: Math.random(), ts: Date.now() });
}

export async function POST(request: NextRequest) {
  await request.json();
  return NextResponse.json({ success: true });
}
import { NextRequest, NextResponse } from 'next/server';

let logs: any[] = [];

export async function GET() {
  return NextResponse.json(logs);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  logs.push({ ...body, ts: new Date().toISOString() });
  return NextResponse.json({ success: true });
}
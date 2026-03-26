import { NextRequest, NextResponse } from 'next/server';
import { updateActivity } from '../_store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ok = updateActivity(String(body?.deviceId));
    return NextResponse.json({ success: ok });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
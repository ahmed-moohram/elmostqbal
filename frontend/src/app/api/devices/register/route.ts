import { NextRequest, NextResponse } from 'next/server';
import { registerDevice } from '../_store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, deviceId, name, type, os, browser, ipAddress } = body || {};
    if (!studentId || !deviceId) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    const record = registerDevice({ studentId, deviceId, name, type, os, browser, ipAddress });
    return NextResponse.json({ success: true, data: record });
  } catch {
    return NextResponse.json({ error: 'register_failed' }, { status: 500 });
  }
}
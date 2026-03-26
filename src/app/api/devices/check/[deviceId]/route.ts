import { NextRequest, NextResponse } from 'next/server';
import { getDevice } from '../../_store';

export async function GET(_req: NextRequest, { params }: { params: { deviceId: string } }) {
  const rec = getDevice(String(params.deviceId));
  if (!rec) return NextResponse.json({ isBlocked: false });
  return NextResponse.json({ isBlocked: !!rec.blocked, blockedReason: rec.blockedReason });
}
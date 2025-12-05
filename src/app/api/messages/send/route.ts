import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api';

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization');
  if (API_BASE_URL) {
    const res = await fetch(`${API_BASE_URL}/api/messages/send`, { method: 'POST', headers: token ? { Authorization: token } : undefined, body: await request.text() });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }
  return NextResponse.json({ success: true });
}
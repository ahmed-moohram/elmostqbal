import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api';

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  const token = request.headers.get('authorization');
  if (API_BASE_URL) {
    const res = await fetch(`${API_BASE_URL}/api/messages/conversation/${params.userId}`, { headers: token ? { Authorization: token } : undefined });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }
  return NextResponse.json({ messages: [{ id: 'm1', from: 'system', content: 'مرحبا' }] });
}
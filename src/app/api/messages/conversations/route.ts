import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api';

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization');
  if (API_BASE_URL) {
    const res = await fetch(`${API_BASE_URL}/api/messages/conversations`, { headers: token ? { Authorization: token } : undefined });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }
  return NextResponse.json([{ id: 'c1', name: 'دعم المنصة', lastMessage: 'مرحبا', unread: 1 }]);
}
import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api';

export async function GET(request: NextRequest, { params }: { params: { targetType: string; targetId: string } }) {
  const token = request.headers.get('authorization');
  if (API_BASE_URL) {
    const res = await fetch(`${API_BASE_URL}/api/ratings/user/${params.targetType}/${params.targetId}`, { headers: token ? { Authorization: token } : undefined });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }
  return NextResponse.json({ rating: null });
}
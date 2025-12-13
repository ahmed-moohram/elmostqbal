import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api';

export async function GET(request: NextRequest, { params }: { params: { targetType: string; targetId: string } }) {
  const token = request.headers.get('authorization');
  const search = request.nextUrl.search;
  if (API_BASE_URL) {
    const res = await fetch(`${API_BASE_URL}/api/ratings/${params.targetType}/${params.targetId}${search}`, { headers: token ? { Authorization: token } : undefined });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }
  return NextResponse.json({ ratings: [], pagination: { page: 1, pages: 1, total: 0 } });
}
import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api';

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization');
  if (API_BASE_URL) {
    const res = await fetch(`${API_BASE_URL}/api/courses/enrolled/my-courses`, { headers: token ? { Authorization: token } : undefined });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }
  return NextResponse.json([{ _id: '1', title: 'رياضيات', progress: 40 }, { _id: '2', title: 'فيزياء', progress: 80 }]);
}
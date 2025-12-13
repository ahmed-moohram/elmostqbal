import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api';

export async function GET(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const token = request.headers.get('authorization');
    const qs = request.nextUrl.searchParams.toString();
    if (API_BASE_URL) {
      const endpoint = `${API_BASE_URL}/api/questions/course/${params.courseId}${qs ? `?${qs}` : ''}`;
      const res = await fetch(endpoint, { headers: token ? { Authorization: token } : undefined });
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json({ data: { questions: [], pagination: { page: 1, pages: 1 } } });
  } catch (e) {
    return NextResponse.json({ message: 'proxy_failed' }, { status: 500 });
  }
}
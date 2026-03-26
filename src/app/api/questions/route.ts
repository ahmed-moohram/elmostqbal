import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api';

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization');
  if (API_BASE_URL) {
    const res = await fetch(`${API_BASE_URL}/api/questions`, { method: 'POST', headers: { Authorization: token || '' , 'Content-Type': 'application/json' }, body: await request.text() });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }
  return NextResponse.json({ message: 'created', data: await request.json() }, { status: 201 });
}
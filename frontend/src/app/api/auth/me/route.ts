import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization');
  if (!token) return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
  return NextResponse.json({ user: { id: 'u1', name: 'طالب', role: 'student' } });
}
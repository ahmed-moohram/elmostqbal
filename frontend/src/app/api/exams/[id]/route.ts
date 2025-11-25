import { NextRequest, NextResponse } from 'next/server';
import { getExam, updateExam, deleteExam } from '../_store';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const exam = getExam(String(params.id));
  if (!exam) return NextResponse.json({ error: 'exam_not_found' }, { status: 404 });
  return NextResponse.json({ exam });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = await request.json();
    const updated = updateExam(String(params.id), payload);
    if (!updated) return NextResponse.json({ error: 'exam_not_found' }, { status: 404 });
    return NextResponse.json({ exam: updated });
  } catch (err) {
    return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ok = deleteExam(String(params.id));
  if (!ok) return NextResponse.json({ error: 'exam_not_found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
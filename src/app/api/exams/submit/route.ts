import { NextRequest, NextResponse } from 'next/server';
import { getExam } from '../_store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { examId, answers, courseId } = body || {};
    const exam = getExam(String(examId));
    if (!exam) return NextResponse.json({ error: 'exam_not_found' }, { status: 404 });
    let score = 0;
    let total = 0;
    for (const q of exam.questions) {
      total += q.marks || 0;
      const ans = answers ? answers[q.id] : undefined;
      if (ans && ans === (q as any).correctAnswer) score += q.marks || 0;
    }
    const passed = score >= exam.passingMarks;
    return NextResponse.json({ success: true, courseId, examId, score, totalMarks: total, passed });
  } catch {
    return NextResponse.json({ error: 'submit_failed' }, { status: 500 });
  }
}
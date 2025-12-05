import { NextRequest, NextResponse } from 'next/server';
import { addExam, getExams } from './_store';

export async function GET() {
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 500 + 500));
  return NextResponse.json(getExams());
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || !body.id || !body.title || !body.courseId || !Array.isArray(body.questions)) {
      return NextResponse.json({ error: 'invalid_exam_payload' }, { status: 400 });
    }
    const created = addExam({
      id: String(body.id),
      title: String(body.title),
      courseId: String(body.courseId),
      description: body.description ? String(body.description) : undefined,
      duration: Number(body.duration || 0),
      totalMarks: Number(body.totalMarks || 0),
      passingMarks: Number(body.passingMarks || 0),
      questions: body.questions,
      startDate: body.startDate,
      endDate: body.endDate,
      isActive: body.isActive,
    });
    return NextResponse.json({ exam: created }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'create_failed' }, { status: 500 });
  }
}

// تقديم الامتحان أصبح عبر /api/exams/submit

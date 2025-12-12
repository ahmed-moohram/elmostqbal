import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase configuration for teacher exam results API. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface QuizResultRow {
  id: string;
  user_id: string;
  course_id: string;
  quiz_id: string | null;
  quiz_title: string | null;
  score: number;
  total_questions: number;
  passed: boolean | null;
  time_taken: number | null;
  answers: any;
  attempted_at: string | null;
  created_at: string | null;
}

interface ExamResultDto {
  id: string;
  studentId: string;
  studentName: string;
  email: string;
  parentPhone: string | null;
  score: number;
  totalQuestions: number;
  passed: boolean;
  attemptedAt: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const examId = searchParams.get('examId');
    const teacherId = searchParams.get('teacherId');

    if (!courseId || !examId) {
      return NextResponse.json(
        { error: 'courseId and examId are required' },
        { status: 400 }
      );
    }

    // إذا كان examId ليس UUID صالحًا (مثلاً من امتحان قديم تم إنشاؤه بهوية بسيطة)،
    // نتجنب استعلام Supabase الذي قد يفشل بتحويل النوع ونعيد نتائج فارغة بدلاً من 500.
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(examId)) {
      return NextResponse.json({ results: [] as ExamResultDto[] });
    }

    // التحقق من أن الكورس يخص هذا المدرس (إن وجد teacherId)
    if (teacherId) {
      const { data: courseRow, error: courseError } = await supabase
        .from('courses')
        .select('id, instructor_id')
        .eq('id', courseId)
        .maybeSingle();

      if (courseError) {
        console.error(
          'Error verifying teacher course in /api/teacher/exams/results:',
          courseError
        );
        return NextResponse.json(
          { error: 'Failed to verify teacher course' },
          { status: 500 }
        );
      }

      if (!courseRow || String(courseRow.instructor_id) !== teacherId) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
    }

    const { data: quizRows, error: quizError } = await supabase
      .from('quiz_results')
      .select(
        'id, user_id, course_id, quiz_id, quiz_title, score, total_questions, passed, time_taken, answers, attempted_at, created_at'
      )
      .eq('course_id', courseId)
      .eq('quiz_id', examId)
      .order('attempted_at', { ascending: false });

    if (quizError) {
      console.error('Error loading quiz_results for teacher exams:', quizError);
      return NextResponse.json(
        { error: 'Failed to load exam results' },
        { status: 500 }
      );
    }

    const rows: QuizResultRow[] = (quizRows || []) as any[];

    if (!rows.length) {
      return NextResponse.json({ results: [] as ExamResultDto[] });
    }

    const userIds = Array.from(
      new Set(rows.map((r) => String(r.user_id)).filter((id) => !!id))
    );

    const { data: usersRows, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, parent_phone, student_phone, phone')
      .in('id', userIds as any);

    if (usersError) {
      console.error('Error loading users for teacher exam results:', usersError);
      return NextResponse.json(
        { error: 'Failed to load students profiles' },
        { status: 500 }
      );
    }

    const usersMap = new Map<string, any>(
      (usersRows || []).map((u: any) => [String(u.id), u])
    );

    const results: ExamResultDto[] = rows.map((row) => {
      const u = usersMap.get(String(row.user_id));
      let cheated = false;
      try {
        if (row.answers && typeof row.answers === 'object') {
          cheated = !!(row.answers as any).__cheated;
        }
      } catch {
        cheated = false;
      }
      return {
        id: String(row.id),
        studentId: String(row.user_id),
        studentName: (u && u.name) || 'طالب',
        email: (u && u.email) || '',
        parentPhone:
          (u && (u.parent_phone || u.phone || u.student_phone)) || null,
        score: Number(row.score || 0),
        totalQuestions: Number(row.total_questions || 0),
        passed: !!row.passed,
        attemptedAt: row.attempted_at || row.created_at,
        cheated,
      };
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Unexpected error in /api/teacher/exams/results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

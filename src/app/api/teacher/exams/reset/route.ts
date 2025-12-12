import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase configuration for teacher exam reset API. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const { courseId, examId, studentId, teacherId } = body || {};

    if (!courseId || !examId || !studentId) {
      return NextResponse.json(
        { error: 'courseId, examId and studentId are required' },
        { status: 400 },
      );
    }

    // التحقق من أن الكورس يخص هذا المدرس (إن وجد teacherId)
    if (teacherId) {
      const { data: courseRow, error: courseError } = await supabase
        .from('courses')
        .select('id, instructor_id')
        .eq('id', courseId)
        .maybeSingle();

      if (courseError) {
        console.error('Error verifying teacher course in exam reset API:', courseError);
        return NextResponse.json(
          { error: 'Failed to verify teacher course' },
          { status: 500 },
        );
      }

      if (!courseRow || String(courseRow.instructor_id) !== String(teacherId)) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
    }

    const { error: deleteError } = await supabase
      .from('quiz_results')
      .delete()
      .eq('course_id', courseId)
      .eq('quiz_id', examId)
      .eq('user_id', studentId);

    if (deleteError) {
      console.error('Error resetting exam results for student:', deleteError);
      return NextResponse.json(
        { error: 'Failed to reset exam for student' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in teacher exam reset API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

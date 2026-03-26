import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const roleCookie = request.cookies.get('user-role')?.value;
    const authCookie =
      request.cookies.get('auth-token')?.value || request.cookies.get('auth_token')?.value;
    const cookieUserId = request.cookies.get('user-id')?.value;

    if (!authCookie || !roleCookie || !cookieUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (roleCookie !== 'teacher' && roleCookie !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
      if (String(teacherId) !== String(cookieUserId)) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }

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

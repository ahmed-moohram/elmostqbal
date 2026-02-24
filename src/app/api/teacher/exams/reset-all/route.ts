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
    const { courseId, examId, teacherId } = body || {};

    if (!courseId || !examId) {
      return NextResponse.json(
        { error: 'courseId and examId are required' },
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
        console.error('Error verifying teacher course in exam reset-all API:', courseError);
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
      .eq('quiz_id', examId);

    if (deleteError) {
      console.error('Error resetting exam for all students:', deleteError);
      return NextResponse.json(
        { error: 'Failed to reset exam for all students' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in teacher exam reset-all API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const courseId = searchParams.get('courseId');
    const examId = searchParams.get('examId');
    const userId = searchParams.get('userId');

    if (!courseId || !examId || !userId) {
      return NextResponse.json(
        { error: 'courseId, examId and userId are required' },
        { status: 400 },
      );
    }

    if (!UUID_REGEX.test(String(courseId))) {
      return NextResponse.json(
        { success: false, error: 'invalid_course_id' },
        { status: 400 },
      );
    }

    if (!UUID_REGEX.test(String(examId))) {
      return NextResponse.json(
        { success: false, error: 'invalid_exam_id' },
        { status: 400 },
      );
    }

    if (!UUID_REGEX.test(String(userId))) {
      return NextResponse.json(
        { success: false, error: 'invalid_user_id' },
        { status: 400 },
      );
    }

    let isEnrolled = false;
    try {
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('id, is_active')
        .eq('student_id', userId)
        .eq('course_id', courseId)
        .maybeSingle();

      if (enrollmentError) {
        console.error('Error checking course_enrollments in student exam status API:', enrollmentError);
        return NextResponse.json(
          { error: 'Failed to verify enrollment' },
          { status: 500 },
        );
      }

      if (enrollment && enrollment.is_active !== false) {
        isEnrolled = true;
      } else {
        const { data: legacyEnrollment, error: legacyError } = await supabase
          .from('enrollments')
          .select('id, is_active')
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .maybeSingle();

        if (legacyError) {
          console.warn('Error checking legacy enrollments in student exam status API:', legacyError);
        }

        if (legacyEnrollment && legacyEnrollment.is_active !== false) {
          isEnrolled = true;
        }
      }
    } catch (enrollmentException) {
      console.error('Unexpected error while checking enrollment in student exam status API:', enrollmentException);
      return NextResponse.json(
        { error: 'Failed to verify enrollment' },
        { status: 500 },
      );
    }

    if (!isEnrolled) {
      return NextResponse.json(
        { success: false, error: 'not_enrolled' },
        { status: 403 },
      );
    }

    const { data: attempts, error } = await supabase
      .from('quiz_results')
      .select('id, answers, score, passed, attempted_at, created_at')
      .eq('course_id', courseId)
      .eq('quiz_id', examId)
      .eq('user_id', userId)
      .order('attempted_at', { ascending: false });

    if (error) {
      console.error('Error loading quiz_results in student exam status API:', error);
      return NextResponse.json(
        { error: 'Failed to load exam status' },
        { status: 500 },
      );
    }

    const list = Array.isArray(attempts) ? attempts : [];
    let cheatAttempts = 0;
    let nonCheatAttempts = 0;

    for (const row of list) {
      let isCheated = false;
      try {
        if (row.answers && typeof row.answers === 'object') {
          if ((row.answers as any).__cheated) {
            isCheated = true;
          }
        }
      } catch {
        isCheated = false;
      }

      if (isCheated) {
        cheatAttempts += 1;
      } else {
        nonCheatAttempts += 1;
      }
    }

    const attemptCount = list.length;
    const hasAnyResult = attemptCount > 0;

    let lastScore: number | null = null;
    let lastPassed: boolean | null = null;

    if (hasAnyResult) {
      const first: any = list[0];

      // دعم كون score راجع كرقم أو كنص من Supabase
      if (first && first.score !== undefined && first.score !== null) {
        const numericScore = Number(first.score);
        if (!Number.isNaN(numericScore)) {
          lastScore = numericScore;
        }
      }

      if (typeof first?.passed === 'boolean') {
        lastPassed = first.passed;
      }
    }

    return NextResponse.json({
      success: true,
      attemptCount,
      cheatAttempts,
      nonCheatAttempts,
      hasAnyResult,
      lastScore,
      lastPassed,
    });
  } catch (error) {
    console.error('Unexpected error in student exam status API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

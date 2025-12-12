import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase configuration for student exam status API. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const examId = searchParams.get('examId');
    const userId = searchParams.get('userId');

    if (!courseId || !examId || !userId) {
      return NextResponse.json(
        { error: 'courseId, examId and userId are required' },
        { status: 400 },
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

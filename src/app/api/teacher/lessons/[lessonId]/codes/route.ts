import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase configuration for teacher lesson codes API. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface RouteParams {
  params: {
    lessonId: string;
  };
}

function generateSingleUseCode(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * chars.length);
    result += chars[idx];
  }
  return result;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const lessonId = params.lessonId;
    const { searchParams } = request.nextUrl;
    const courseId = searchParams.get('courseId');
    const teacherId = searchParams.get('teacherId');

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Missing lessonId in route params' },
        { status: 400 },
      );
    }

    if (!courseId || !teacherId) {
      return NextResponse.json(
        { error: 'courseId and teacherId are required' },
        { status: 400 },
      );
    }

    const { data: courseRow, error: courseError } = await supabase
      .from('courses')
      .select('id, instructor_id')
      .eq('id', courseId)
      .maybeSingle();

    if (courseError) {
      console.error(
        'Error verifying course ownership in teacher lesson codes API:',
        courseError,
      );
      return NextResponse.json(
        { error: 'Failed to verify teacher course' },
        { status: 500 },
      );
    }

    if (!courseRow || String(courseRow.instructor_id) !== String(teacherId)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const { data: lessonRow, error: lessonError } = await supabase
      .from('lessons')
      .select('id, course_id')
      .eq('id', lessonId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (lessonError) {
      console.error(
        'Error loading lesson for teacher lesson codes API:',
        lessonError,
      );
      return NextResponse.json(
        { error: 'Failed to load lesson for code generation' },
        { status: 500 },
      );
    }

    if (!lessonRow) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    let newCode = '';
    let attempts = 0;

    while (attempts < 5) {
      attempts += 1;
      newCode = generateSingleUseCode(8);

      try {
        const { data: existing, error: existingError } = await supabase
          .from('lesson_access_codes')
          .select('id')
          .eq('code', newCode)
          .limit(1);

        if (existingError) {
          console.error(
            'Error checking existing lesson_access_codes in teacher lesson codes API:',
            existingError,
          );
          break;
        }

        if (!existing || existing.length === 0) {
          break;
        }
      } catch (lookupError) {
        console.error(
          'Unexpected error while checking lesson_access_codes in teacher lesson codes API:',
          lookupError,
        );
        break;
      }
    }

    if (!newCode) {
      return NextResponse.json(
        { error: 'Failed to generate unique code' },
        { status: 500 },
      );
    }

    const { data: insertRow, error: insertError } = await supabase
      .from('lesson_access_codes')
      .insert({
        lesson_id: lessonId,
        code: newCode,
        is_used: false,
      })
      .select('id, code')
      .maybeSingle();

    if (insertError) {
      console.error(
        'Error inserting lesson_access_codes row in teacher lesson codes API:',
        insertError,
      );
      return NextResponse.json(
        { error: 'Failed to create lesson code' },
        { status: 500 },
      );
    }

    if (!insertRow) {
      return NextResponse.json(
        { error: 'Failed to create lesson code (no row returned)' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, code: insertRow.code });
  } catch (e: any) {
    console.error('Unexpected error in teacher lesson codes API:', e);
    return NextResponse.json(
      { error: e?.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}

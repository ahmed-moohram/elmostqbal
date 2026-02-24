import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

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
    const countParam = searchParams.get('count');

    const roleCookie = request.cookies.get('user-role')?.value;
    const authCookie =
      request.cookies.get('auth-token')?.value || request.cookies.get('auth_token')?.value;
    const cookieUserId = request.cookies.get('user-id')?.value;

    let count = Number(countParam || '1');
    if (!Number.isFinite(count) || count <= 0) count = 1;
    if (count > 100) count = 100;

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Missing lessonId in route params' },
        { status: 400 },
      );
    }

    if (!authCookie || !roleCookie || !cookieUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (roleCookie !== 'teacher' && roleCookie !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!courseId || !teacherId) {
      return NextResponse.json(
        { error: 'courseId and teacherId are required' },
        { status: 400 },
      );
    }

    if (String(cookieUserId) !== String(teacherId)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
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

    if (count > 1) {
      const rowsToInsert: { lesson_id: string; code: string; is_used: boolean }[] = [];

      for (let i = 0; i < count; i++) {
        rowsToInsert.push({
          lesson_id: lessonId,
          code: generateSingleUseCode(8),
          is_used: false,
        });
      }

      const { data: insertedRows, error: insertError } = await supabase
        .from('lesson_access_codes')
        .insert(rowsToInsert)
        .select('code');

      if (insertError || !insertedRows) {
        console.error(
          'Error inserting batch lesson_access_codes rows in teacher lesson codes API:',
          insertError,
        );
        return NextResponse.json(
          { error: 'Failed to create lesson codes batch' },
          { status: 500 },
        );
      }

      const codes = (insertedRows as any[]).map((row: any) => String(row.code));

      return NextResponse.json({ success: true, codes });
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

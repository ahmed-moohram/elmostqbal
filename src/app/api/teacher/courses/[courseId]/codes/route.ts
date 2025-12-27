import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase configuration for teacher course codes API. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface RouteParams {
  params: {
    courseId: string;
  };
}

function generateCourseCode(length: number = 8): string {
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
    const courseId = params.courseId;
    const { searchParams } = request.nextUrl;
    const teacherId = searchParams.get('teacherId');
    const countParam = searchParams.get('count');

    const roleCookie = request.cookies.get('user-role')?.value;
    const authCookie =
      request.cookies.get('auth-token')?.value || request.cookies.get('auth_token')?.value;
    const cookieUserId = request.cookies.get('user-id')?.value;

    let count = Number(countParam || '1');
    if (!Number.isFinite(count) || count <= 0) count = 1;
    if (count > 200) count = 200;

    if (!courseId) {
      return NextResponse.json(
        { error: 'Missing courseId in route params' },
        { status: 400 },
      );
    }

    if (!authCookie || !roleCookie || !cookieUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (roleCookie !== 'teacher' && roleCookie !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!teacherId) {
      return NextResponse.json(
        { error: 'teacherId is required' },
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
        'Error verifying course ownership in teacher course codes API:',
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

    const rowsToInsert: { course_id: string; code: string; is_used: boolean }[] = [];

    for (let i = 0; i < count; i++) {
      rowsToInsert.push({
        course_id: courseId,
        code: generateCourseCode(8),
        is_used: false,
      });
    }

    const { data: insertedRows, error: insertError } = await supabase
      .from('course_access_codes')
      .insert(rowsToInsert)
      .select('code');

    if (insertError || !insertedRows) {
      console.error(
        'Error inserting course_access_codes rows in teacher course codes API:',
        insertError,
      );
      return NextResponse.json(
        { error: 'Failed to create course codes' },
        { status: 500 },
      );
    }

    const codes = (insertedRows as any[]).map((row: any) => String(row.code));

    return NextResponse.json({ success: true, codes });
  } catch (e: any) {
    console.error('Unexpected error in teacher course codes API:', e);
    return NextResponse.json(
      { error: e?.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}

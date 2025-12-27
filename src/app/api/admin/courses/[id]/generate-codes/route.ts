import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase configuration. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface RouteParams {
  params: {
    id: string;
  };
}

function generateCourseCode(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // بدون 0, O, I, 1 لتجنب الالتباس
  let result = '';
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * chars.length);
    result += chars[idx];
  }
  return result;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const courseId = params.id;
    const body = await request.json().catch(() => ({}));
    const { count = 1, notes, expiresAt, maxUses = 1 } = body;

    // التحقق من الصلاحيات
    const roleCookie = request.cookies.get('user-role')?.value;
    const cookieUserId = request.cookies.get('user-id')?.value;

    if (!roleCookie || !cookieUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (roleCookie !== 'admin' && roleCookie !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // التحقق من صحة courseId
    if (!courseId) {
      return NextResponse.json(
        { error: 'Missing courseId' },
        { status: 400 },
      );
    }

    // التحقق من وجود الكورس
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, instructor_id, title')
      .eq('id', courseId)
      .maybeSingle();

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 },
      );
    }

    // التحقق من أن المستخدم هو المدرس أو الأدمن
    if (roleCookie === 'teacher' && String(course.instructor_id) !== String(cookieUserId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // التحقق من عدد الأكواد
    let codeCount = Number(count);
    if (!Number.isFinite(codeCount) || codeCount <= 0) codeCount = 1;
    if (codeCount > 500) codeCount = 500; // حد أقصى 500 كود

    // إنشاء الأكواد
    const codesToInsert: Array<{
      course_id: string;
      code: string;
      created_by: string;
      notes?: string | null;
      expires_at?: string | null;
      max_uses: number;
      is_used: boolean;
      current_uses: number;
    }> = [];

    // إنشاء أكواد فريدة
    const existingCodes = new Set<string>();
    let attempts = 0;
    const maxAttempts = codeCount * 10; // محاولات إضافية للتأكد من الحصول على أكواد فريدة

    while (codesToInsert.length < codeCount && attempts < maxAttempts) {
      attempts++;
      const newCode = generateCourseCode(8);

      // التحقق من أن الكود فريد
      if (!existingCodes.has(newCode)) {
        // التحقق من قاعدة البيانات
        const { data: existing } = await supabase
          .from('course_access_codes')
          .select('id')
          .eq('code', newCode)
          .limit(1)
          .maybeSingle();

        if (!existing) {
          codesToInsert.push({
            course_id: courseId,
            code: newCode,
            created_by: cookieUserId,
            notes: notes || null,
            expires_at: expiresAt || null,
            max_uses: Number(maxUses) || 1,
            is_used: false,
            current_uses: 0,
          });
          existingCodes.add(newCode);
        }
      }
    }

    if (codesToInsert.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate unique codes' },
        { status: 500 },
      );
    }

    // إدراج الأكواد في قاعدة البيانات
    const { data: insertedCodes, error: insertError } = await supabase
      .from('course_access_codes')
      .insert(codesToInsert)
      .select('id, code, created_at');

    if (insertError || !insertedCodes) {
      console.error('Error inserting course access codes:', insertError);
      return NextResponse.json(
        { error: 'Failed to create codes', details: insertError?.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      count: insertedCodes.length,
      codes: insertedCodes.map((row: any) => ({
        id: row.id,
        code: row.code,
        createdAt: row.created_at,
      })),
      course: {
        id: course.id,
        title: course.title,
      },
    });
  } catch (e: any) {
    console.error('Unexpected error in generate course codes API:', e);
    return NextResponse.json(
      { error: e?.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}


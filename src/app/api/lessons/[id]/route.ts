import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('❌ Missing Supabase configuration! Check your .env.local file');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

type RouteParams = {
  params: {
    id: string;
  };
};

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const lessonId = params.id;

    if (!lessonId) {
      return NextResponse.json({ error: 'Missing lesson id' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('lessons')
      .select('id, course_id, access_code, is_free, is_preview')
      .eq('id', lessonId)
      .maybeSingle();

    if (error || !data) {
      console.error('Error loading lesson meta:', error);
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    let hasSingleUseCodes = false;
    try {
      const { data: codeRows, error: codesError } = await supabase
        .from('lesson_access_codes')
        .select('id')
        .eq('lesson_id', lessonId)
        .limit(1);

      if (codesError) {
        console.warn(
          'Error checking lesson_access_codes in GET /api/lessons/[id]:',
          codesError,
        );
      } else if (Array.isArray(codeRows) && codeRows.length > 0) {
        hasSingleUseCodes = true;
      }
    } catch (codesException) {
      console.error(
        'Unexpected error while checking lesson_access_codes in GET /api/lessons/[id]:',
        codesException,
      );
    }

    const hasLegacyCode =
      !!data.access_code && String(data.access_code).trim() !== '';

    const hasCode = hasSingleUseCodes || hasLegacyCode;

    return NextResponse.json({
      id: data.id,
      courseId: data.course_id,
      hasCode,
      isFree: !!data.is_free,
      isPreview: !!data.is_preview,
    });
  } catch (e: any) {
    console.error('Unexpected error in GET /api/lessons/[id]:', e);
    return NextResponse.json(
      { error: e?.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const lessonId = params.id;

    if (!lessonId) {
      return NextResponse.json({ success: false, error: 'Missing lesson id' }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const { code } = body || {};

    if (code === undefined || code === null) {
      return NextResponse.json(
        { success: false, error: 'لم يتم إرسال الكود' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('lessons')
      .select('id, course_id, access_code, is_free, is_preview')
      .eq('id', lessonId)
      .maybeSingle();

    if (error || !data) {
      console.error('Error loading lesson for code verification:', error);
      return NextResponse.json(
        { success: false, error: 'الدرس غير موجود' },
        { status: 404 },
      );
    }

    let singleUseCodes: any[] = [];
    let hasAnySingleUseCodes = false;
    let matchedSingleUseCode: any | null = null;

    const inputCode = String(code).trim();

    try {
      const { data: codeRows, error: codesError } = await supabase
        .from('lesson_access_codes')
        .select('id, code, is_used')
        .eq('lesson_id', lessonId);

      if (codesError) {
        console.warn(
          'Error checking lesson_access_codes in POST /api/lessons/[id]:',
          codesError,
        );
      } else if (Array.isArray(codeRows)) {
        singleUseCodes = codeRows;
        hasAnySingleUseCodes = singleUseCodes.length > 0;
        matchedSingleUseCode = singleUseCodes.find((row: any) => {
          const rowCode =
            row.code !== undefined && row.code !== null
              ? String(row.code).trim()
              : '';
          return rowCode !== '' && rowCode === inputCode;
        });
      }
    } catch (codesException) {
      console.error(
        'Unexpected error while checking lesson_access_codes in POST /api/lessons/[id]:',
        codesException,
      );
    }

    if (hasAnySingleUseCodes) {
      if (!matchedSingleUseCode) {
        return NextResponse.json(
          { success: false, requiresCode: true, error: 'الكود غير صحيح' },
          { status: 401 },
        );
      }

      if (matchedSingleUseCode.is_used) {
        return NextResponse.json(
          {
            success: false,
            requiresCode: true,
            error: 'تم استخدام هذا الكود من قبل',
          },
          { status: 401 },
        );
      }

      try {
        const { error: updateError } = await supabase
          .from('lesson_access_codes')
          .update({
            is_used: true,
            used_at: new Date().toISOString(),
          })
          .eq('id', matchedSingleUseCode.id);

        if (updateError) {
          console.error(
            'Error marking single-use lesson code as used in POST /api/lessons/[id]:',
            updateError,
          );
        }
      } catch (updateException) {
        console.error(
          'Unexpected error while marking single-use lesson code as used in POST /api/lessons/[id]:',
          updateException,
        );
      }

      return NextResponse.json({
        success: true,
        requiresCode: true,
        singleUse: true,
      });
    }

    const storedCode = data.access_code ? String(data.access_code).trim() : '';
    const requiresCode = storedCode !== '';

    if (!requiresCode) {
      // لا يوجد كود مخزن لهذا الدرس، نعتبره غير محمي بالكود
      return NextResponse.json({ success: true, requiresCode: false });
    }

    if (inputCode !== storedCode) {
      return NextResponse.json(
        { success: false, requiresCode: true, error: 'الكود غير صحيح' },
        { status: 401 },
      );
    }

    return NextResponse.json({ success: true, requiresCode: true });
  } catch (e: any) {
    console.error('Unexpected error in POST /api/lessons/[id]:', e);
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}

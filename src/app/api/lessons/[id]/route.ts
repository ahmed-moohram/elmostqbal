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

    const hasCode = !!(data.access_code && String(data.access_code).trim() !== '');

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

    const storedCode = data.access_code ? String(data.access_code).trim() : '';
    const requiresCode = storedCode !== '';

    if (!requiresCode) {
      // لا يوجد كود مخزن لهذا الدرس، نعتبره غير محمي بالكود
      return NextResponse.json({ success: true, requiresCode: false });
    }

    const inputCode = String(code).trim();

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

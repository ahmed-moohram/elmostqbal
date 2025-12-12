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
    id: string; // course id
  };
};

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const courseId = params.id;
    if (!courseId) {
      return NextResponse.json({ error: 'Missing course id' }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const {
      section_id,
      title,
      description,
      video_url,
      duration_minutes,
      order_index,
      is_free,
      is_preview,
      is_published,
      access_code,
      type,
      quiz_data,
    } = body || {};

    if (!title) {
      return NextResponse.json({ error: 'Missing lesson title' }, { status: 400 });
    }

    const duration = Math.max(1, Number(duration_minutes) || 0);
    const sectionId = section_id ?? null;

    let orderIndex = Number(order_index);
    if (!orderIndex || !Number.isFinite(orderIndex) || orderIndex <= 0) {
      orderIndex = 1;
    }

    try {
      let query = supabase
        .from('lessons')
        .select('order_index')
        .eq('course_id', courseId);

      if (sectionId === null) {
        // filter on NULL section
        query = query.is('section_id', null);
      } else {
        query = query.eq('section_id', sectionId);
      }

      const { data: existingRows, error: existingError } = await query;

      if (!existingError && existingRows) {
        const used = new Set(
          existingRows
            .map((row: any) => Number(row.order_index) || 0)
            .filter((n) => Number.isFinite(n) && n > 0),
        );

        while (used.has(orderIndex)) {
          orderIndex += 1;
        }
      }
    } catch (lookupError) {
      console.error('❌ Error checking existing lesson order indices:', lookupError);
    }

    const { data, error } = await supabase
      .from('lessons')
      .insert({
        course_id: courseId,
        section_id: sectionId,
        title,
        description: description || '',
        video_url: video_url || null,
        duration: duration,
        duration_minutes: duration,
        order_index: orderIndex,
        is_free: !!is_free,
        is_preview: !!is_preview,
        is_published: is_published !== undefined ? !!is_published : true,
        access_code: access_code || null,
        type: type === 'quiz' ? 'quiz' : 'video',
        quiz_data: quiz_data || null,
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('❌ Error inserting lesson via API:', error);
      const message = error?.message || 'Insert failed';
      const isUniqueViolation =
        typeof message === 'string' &&
        message.includes('duplicate key value') &&
        message.includes('lessons_section_id_order_index_key');

      return NextResponse.json(
        isUniqueViolation
          ? {
              error:
                'يوجد بالفعل درس بنفس الترتيب داخل هذا القسم. تم رفض حفظ الدرس لتجنب تكرار الترتيب.',
              code: 'DUPLICATE_LESSON_ORDER_INDEX',
            }
          : { error: message },
        { status: isUniqueViolation ? 409 : 500 },
      );
    }

    return NextResponse.json({ lesson: data });
  } catch (e: any) {
    console.error('❌ Unexpected error in POST /api/courses/[id]/lessons:', e);
    return NextResponse.json(
      { error: e?.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const courseId = params.id;
    if (!courseId) {
      return NextResponse.json({ error: 'Missing course id' }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const { id, ...rest } = body || {};

    if (!id) {
      return NextResponse.json({ error: 'Missing lesson id' }, { status: 400 });
    }

    const updates: any = {};

    if (rest.section_id !== undefined) updates.section_id = rest.section_id ?? null;
    if (rest.title !== undefined) updates.title = rest.title;
    if (rest.description !== undefined) updates.description = rest.description ?? '';
    if (rest.video_url !== undefined) updates.video_url = rest.video_url ?? null;
    if (rest.duration_minutes !== undefined) {
      const d = Math.max(1, Number(rest.duration_minutes) || 0);
      updates.duration = d;
      updates.duration_minutes = d;
    }
    if (rest.order_index !== undefined) updates.order_index = Number(rest.order_index) || 1;
    if (rest.is_free !== undefined) updates.is_free = !!rest.is_free;
    if (rest.is_preview !== undefined) updates.is_preview = !!rest.is_preview;
    if (rest.is_published !== undefined) updates.is_published = !!rest.is_published;
    if (rest.access_code !== undefined) updates.access_code = rest.access_code || null;
    if (rest.type !== undefined) updates.type = rest.type === 'quiz' ? 'quiz' : 'video';
    if (rest.quiz_data !== undefined) updates.quiz_data = rest.quiz_data || null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('lessons')
      .update(updates)
      .eq('id', id)
      .eq('course_id', courseId)
      .select('*')
      .single();

    if (error || !data) {
      console.error('❌ Error updating lesson via API:', error);
      const message = error?.message || 'Update failed';
      const isUniqueViolation =
        typeof message === 'string' &&
        message.includes('duplicate key value') &&
        message.includes('lessons_section_id_order_index_key');

      return NextResponse.json(
        isUniqueViolation
          ? {
              error:
                'يوجد بالفعل درس بنفس الترتيب داخل هذا القسم. تم رفض حفظ الدرس لتجنب تكرار الترتيب.',
              code: 'DUPLICATE_LESSON_ORDER_INDEX',
            }
          : { error: message },
        { status: isUniqueViolation ? 409 : 500 },
      );
    }

    return NextResponse.json({ lesson: data });
  } catch (e: any) {
    console.error('❌ Unexpected error in PUT /api/courses/[id]/lessons:', e);
    return NextResponse.json(
      { error: e?.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const courseId = params.id;
    if (!courseId) {
      return NextResponse.json({ error: 'Missing course id' }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const { id } = body || {};

    if (!id) {
      return NextResponse.json({ error: 'Missing lesson id' }, { status: 400 });
    }

    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', id)
      .eq('course_id', courseId);

    if (error) {
      console.error('❌ Error deleting lesson via API:', error);
      return NextResponse.json(
        { error: error?.message || 'Delete failed' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('❌ Unexpected error in DELETE /api/courses/[id]/lessons:', e);
    return NextResponse.json(
      { error: e?.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}

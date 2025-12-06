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
    } = body || {};

    if (!title) {
      return NextResponse.json({ error: 'Missing lesson title' }, { status: 400 });
    }

    const duration = Math.max(1, Number(duration_minutes) || 0);
    const orderIndex = order_index != null ? Number(order_index) : 1;

    const { data, error } = await supabase
      .from('lessons')
      .insert({
        course_id: courseId,
        section_id: section_id ?? null,
        title,
        description: description || '',
        video_url: video_url || null,
        duration: duration,
        duration_minutes: duration,
        order_index: orderIndex,
        is_free: !!is_free,
        is_preview: !!is_preview,
        is_published: is_published !== undefined ? !!is_published : true,
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('❌ Error inserting lesson via API:', error);
      return NextResponse.json(
        { error: error?.message || 'Insert failed' },
        { status: 500 },
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
      return NextResponse.json(
        { error: error?.message || 'Update failed' },
        { status: 500 },
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

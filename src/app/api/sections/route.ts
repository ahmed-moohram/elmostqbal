import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import supabaseClient from '@/lib/supabase-client';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

function getSupabaseWrite() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const srk = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (srk && url) return createClient(url, srk);
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error('❌ Missing Supabase configuration! Check your .env.local file');
  }
  try {
    return createRouteHandlerClient({ cookies }, { supabaseUrl: url, supabaseKey: anon });
  } catch {
    return supabaseClient;
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return NextResponse.json({ error: 'Supabase service role key is missing' }, { status: 500 });
    const supabase = createClient(url, key);
    const courseId = new URL(request.url).searchParams.get('courseId');
    if (!courseId) return NextResponse.json([]);
    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return NextResponse.json({ error: 'Supabase service role key is missing' }, { status: 500 });
    const supabase = createClient(url, key);
    const body = await request.json();
    const { courseId, title, description, orderIndex, lessons } = body;
    if (!courseId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const { data: section, error: sectionError } = await supabase
      .from('sections')
      .insert({
        course_id: courseId,
        title,
        description: description || '',
        order_index: orderIndex ?? 1,
      })
      .select()
      .single();
    if (sectionError || !section) {
      return NextResponse.json({ error: sectionError?.message || 'Insert failed' }, { status: 500 });
    }
    let insertedLessons: any[] = [];
    if (Array.isArray(lessons) && lessons.length > 0) {
      const payload = lessons.map((l: any, idx: number) => ({
        section_id: section.id,
        title: l.title,
        description: l.description || '',
        video_url: l.video_url || '',
        duration: Math.max(1, Number(l.duration) || 0),
        duration_minutes: Math.max(1, Number(l.duration_minutes ?? l.duration) || 0),
        order_index: l.order_index ?? l.order ?? idx + 1,
        is_preview: !!l.is_preview,
        is_published: true,
      }));
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .insert(payload)
        .select();
      if (lessonsError) {
        return NextResponse.json({ error: lessonsError.message }, { status: 500 });
      }
      insertedLessons = lessonsData || [];
    }
    return NextResponse.json({ section, lessons: insertedLessons });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
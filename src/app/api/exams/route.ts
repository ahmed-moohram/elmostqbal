import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase configuration for exams API. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    let query = supabase
      .from('exams')
      .select(
        'id, course_id, section_id, order_index, title, description, duration, total_marks, passing_marks, questions, start_date, end_date, is_active',
      );

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading exams from database:', error);
      return NextResponse.json(
        {
          error: 'failed_to_load_exams',
          detail: (error as any)?.message || String(error),
        },
        { status: 500 },
      );
    }

    const exams = (data || []).map((row: any) => ({
      id: String(row.id),
      title: row.title || '',
      courseId: String(row.course_id),
      sectionId: row.section_id ? String(row.section_id) : null,
      orderIndex: typeof row.order_index === 'number' ? row.order_index : Number(row.order_index || 0) || 0,
      description: row.description || '',
      duration: Number(row.duration || 0),
      totalMarks: Number(row.total_marks || 0),
      passingMarks: Number(row.passing_marks || 0),
      questions: row.questions || [],
      startDate: row.start_date || null,
      endDate: row.end_date || null,
      isActive: row.is_active ?? true,
    }));

    return NextResponse.json(exams);
  } catch (err) {
    console.error('Unexpected error in /api/exams GET:', err);
    return NextResponse.json(
      {
        error: 'failed_to_load_exams',
        detail: (err as any)?.message || String(err),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || !body.id || !body.title || !body.courseId || !Array.isArray(body.questions)) {
      return NextResponse.json({ error: 'invalid_exam_payload' }, { status: 400 });
    }

    const insertPayload = {
      id: String(body.id),
      course_id: String(body.courseId),
      section_id: body.sectionId ? String(body.sectionId) : null,
      order_index:
        typeof body.orderIndex === 'number'
          ? body.orderIndex
          : Number(body.orderIndex || 0) || 0,
      title: String(body.title),
      description: body.description ? String(body.description) : null,
      duration: Number(body.duration || 0),
      total_marks: Number(body.totalMarks || 0),
      passing_marks: Number(body.passingMarks || 0),
      questions: body.questions,
      start_date: body.startDate || null,
      end_date: body.endDate || null,
      is_active: body.isActive ?? true,
    };

    const { data, error } = await supabase
      .from('exams')
      .insert(insertPayload)
      .select(
        'id, course_id, title, description, duration, total_marks, passing_marks, questions, start_date, end_date, is_active',
      )
      .maybeSingle();

    if (error || !data) {
      console.error('Error inserting exam into database:', error);
      return NextResponse.json(
        {
          error: 'create_failed',
          detail: (error as any)?.message || String(error),
        },
        { status: 500 },
      );
    }

    const created = {
      id: String(data.id),
      title: data.title || '',
      courseId: String(data.course_id),
      sectionId: data.section_id ? String(data.section_id) : null,
      orderIndex:
        typeof data.order_index === 'number'
          ? data.order_index
          : Number(data.order_index || 0) || 0,
      description: data.description || '',
      duration: Number(data.duration || 0),
      totalMarks: Number(data.total_marks || 0),
      passingMarks: Number(data.passing_marks || 0),
      questions: data.questions || [],
      startDate: data.start_date || null,
      endDate: data.end_date || null,
      isActive: data.is_active ?? true,
    };

    return NextResponse.json({ exam: created }, { status: 201 });
  } catch (err) {
    console.error('Unexpected error in /api/exams POST:', err);
    return NextResponse.json({ error: 'create_failed' }, { status: 500 });
  }
}

// تقديم الامتحان أصبح عبر /api/exams/submit

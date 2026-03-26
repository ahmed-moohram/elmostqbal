import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { examCreateSchema, validateRequest } from '@/lib/validation';

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
    const { searchParams } = request.nextUrl;
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
    // Validate request body using Zod
    const validation = await validateRequest(request, examCreateSchema);
    if (!validation.success) {
      return validation.response;
    }

    const validatedData = validation.data;

    const insertPayload = {
      id: validatedData.course_id + '-' + Date.now(), // Generate ID if not provided
      course_id: validatedData.course_id,
      section_id: validatedData.section_id || null,
      order_index: validatedData.order_index || 0,
      title: validatedData.title,
      description: validatedData.description || null,
      duration: validatedData.duration,
      total_marks: validatedData.total_marks,
      passing_marks: validatedData.passing_marks,
      questions: validatedData.questions,
      start_date: validatedData.start_date || null,
      end_date: validatedData.end_date || null,
      is_active: validatedData.is_active ?? true,
    };

    const { data, error } = await supabase
      .from('exams')
      .insert(insertPayload)
      .select(
        'id, course_id, section_id, order_index, title, description, duration, total_marks, passing_marks, questions, start_date, end_date, is_active',
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

    const createdRow: any = data;

    const created = {
      id: String(createdRow.id),
      title: createdRow.title || '',
      courseId: String(createdRow.course_id),
      sectionId: createdRow.section_id ? String(createdRow.section_id) : null,
      orderIndex:
        typeof createdRow.order_index === 'number'
          ? createdRow.order_index
          : Number(createdRow.order_index || 0) || 0,
      description: createdRow.description || '',
      duration: Number(createdRow.duration || 0),
      totalMarks: Number(createdRow.total_marks || 0),
      passingMarks: Number(createdRow.passing_marks || 0),
      questions: createdRow.questions || [],
      startDate: createdRow.start_date || null,
      endDate: createdRow.end_date || null,
      isActive: createdRow.is_active ?? true,
    };

    return NextResponse.json({ exam: created }, { status: 201 });
  } catch (err) {
    console.error('Unexpected error in /api/exams POST:', err);
    return NextResponse.json({ error: 'create_failed' }, { status: 500 });
  }
}

// تقديم الامتحان أصبح عبر /api/exams/submit

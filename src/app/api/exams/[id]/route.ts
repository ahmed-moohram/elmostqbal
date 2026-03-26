import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/lib/supabase-server';

function mapExamRow(row: any) {
  return {
    id: String(row.id),
    title: row.title || '',
    courseId: String(row.course_id),
    sectionId: row.section_id ? String(row.section_id) : null,
    orderIndex:
      typeof row.order_index === 'number'
        ? row.order_index
        : Number(row.order_index || 0) || 0,
    description: row.description || '',
    duration: Number(row.duration || 0),
    totalMarks: Number(row.total_marks || 0),
    passingMarks: Number(row.passing_marks || 0),
    questions: row.questions || [],
    startDate: row.start_date || null,
    endDate: row.end_date || null,
    isActive: row.is_active ?? true,
  };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabase
      .from('exams')
      .select(
        'id, course_id, title, description, duration, total_marks, passing_marks, questions, start_date, end_date, is_active',
      )
      .eq('id', params.id)
      .maybeSingle();

    if (error) {
      console.error('Error loading exam from database:', error);
      return NextResponse.json({ error: 'exam_not_found' }, { status: 404 });
    }

    if (!data) {
      return NextResponse.json({ error: 'exam_not_found' }, { status: 404 });
    }

    return NextResponse.json({ exam: mapExamRow(data) });
  } catch (err) {
    console.error('Unexpected error in /api/exams/[id] GET:', err);
    return NextResponse.json({ error: 'exam_not_found' }, { status: 404 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = await request.json();

    const updates: any = {};
    if (payload.title !== undefined) updates.title = String(payload.title);
    if (payload.courseId !== undefined) updates.course_id = String(payload.courseId);
    if (payload.sectionId !== undefined)
      updates.section_id = payload.sectionId ? String(payload.sectionId) : null;
    if (payload.description !== undefined) updates.description = payload.description;
    if (payload.duration !== undefined) updates.duration = Number(payload.duration || 0);
    if (payload.totalMarks !== undefined) updates.total_marks = Number(payload.totalMarks || 0);
    if (payload.passingMarks !== undefined) updates.passing_marks = Number(payload.passingMarks || 0);
    if (payload.questions !== undefined) updates.questions = payload.questions;
    if (payload.orderIndex !== undefined)
      updates.order_index =
        typeof payload.orderIndex === 'number'
          ? payload.orderIndex
          : Number(payload.orderIndex || 0) || 0;
    if (payload.startDate !== undefined) updates.start_date = payload.startDate;
    if (payload.endDate !== undefined) updates.end_date = payload.endDate;
    if (payload.isActive !== undefined) updates.is_active = !!payload.isActive;

    const { data, error } = await supabase
      .from('exams')
      .update(updates)
      .eq('id', params.id)
      .select(
        'id, course_id, title, description, duration, total_marks, passing_marks, questions, start_date, end_date, is_active',
      )
      .maybeSingle();

    if (error || !data) {
      console.error('Error updating exam in database:', error);
      return NextResponse.json({ error: 'update_failed' }, { status: 500 });
    }

    return NextResponse.json({ exam: mapExamRow(data) });
  } catch (err) {
    console.error('Unexpected error in /api/exams/[id] PUT:', err);
    return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabase.from('exams').delete().eq('id', params.id);

    if (error) {
      console.error('Error deleting exam from database:', error);
      return NextResponse.json({ error: 'exam_not_found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Unexpected error in /api/exams/[id] DELETE:', err);
    return NextResponse.json({ error: 'exam_not_found' }, { status: 404 });
  }
}
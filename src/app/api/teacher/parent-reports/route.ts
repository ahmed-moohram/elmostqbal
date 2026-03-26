import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/lib/supabase-server';

interface ParentReportRow {
  id: string;
  teacher_id: string;
  student_id: string;
  course_id: string;
  parent_phone: string | null;
  student_name: string;
  course_title: string;
  report_text: string;
  sent_via: string | null;
  created_at: string;
}

interface ParentReportDto {
  id: string;
  teacherId: string;
  studentId: string;
  courseId: string;
  parentPhone: string | null;
  studentName: string;
  courseTitle: string;
  reportText: string;
  sentVia: string;
  createdAt: string;
}

function mapRow(row: ParentReportRow): ParentReportDto {
  return {
    id: String(row.id),
    teacherId: String(row.teacher_id),
    studentId: String(row.student_id),
    courseId: String(row.course_id),
    parentPhone: row.parent_phone ?? null,
    studentName: row.student_name,
    courseTitle: row.course_title,
    reportText: row.report_text,
    sentVia: row.sent_via || 'whatsapp',
    createdAt: row.created_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const teacherId = searchParams.get('teacherId');
    const daysParam = searchParams.get('days');

    if (!teacherId) {
      return NextResponse.json({ error: 'teacherId is required' }, { status: 400 });
    }

    const days = Number.isFinite(Number(daysParam)) && Number(daysParam) > 0 ? Number(daysParam) : 7;
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('parent_reports')
      .select('*')
      .eq('teacher_id', teacherId)
      .gte('created_at', fromDate)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching parent_reports:', error);
      return NextResponse.json({ error: 'Failed to load parent reports' }, { status: 500 });
    }

    const reports = (data || []).map(mapRow);

    return NextResponse.json({ reports });
  } catch (err) {
    console.error('Unexpected error in /api/teacher/parent-reports GET:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      teacherId,
      studentId,
      courseId,
      parentPhone,
      studentName,
      courseTitle,
      reportText,
      sentVia,
    } = body || {};

    if (!teacherId || !studentId || !courseId || !studentName || !courseTitle || !reportText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('parent_reports')
      .insert({
        teacher_id: teacherId,
        student_id: studentId,
        course_id: courseId,
        parent_phone: parentPhone || null,
        student_name: studentName,
        course_title: courseTitle,
        report_text: reportText,
        sent_via: sentVia || 'whatsapp',
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('Error inserting into parent_reports:', error);
      return NextResponse.json(
        { error: 'Failed to create parent report record' },
        { status: 500 }
      );
    }

    const report = mapRow(data as ParentReportRow);

    return NextResponse.json({ success: true, report });
  } catch (err) {
    console.error('Unexpected error in /api/teacher/parent-reports POST:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

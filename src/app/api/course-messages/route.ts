import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseKey = supabaseServiceKey || supabaseAnonKey;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration for course messages API');
}

const supabase = createClient(supabaseUrl, supabaseKey as string);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const courseId = searchParams.get('courseId');
    const teacherId = searchParams.get('teacherId');

    if (!courseId && !teacherId) {
      return NextResponse.json(
        { error: 'courseId or teacherId is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('course_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(200);

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/course-messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, teacherId, senderId, senderName, senderRole, content } = body;

    if (!courseId || !senderId || !senderRole || !content) {
      return NextResponse.json(
        { error: 'courseId, senderId, senderRole and content are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('course_messages')
      .insert({
        course_id: courseId,
        teacher_id: teacherId || null,
        sender_id: senderId,
        sender_name: senderName || null,
        sender_role: senderRole,
        content,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/course-messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

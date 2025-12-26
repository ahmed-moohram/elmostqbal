import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { courseMessageCreateSchema, courseMessageGetSchema, validateRequest } from '@/lib/validation';
import { sanitizeHTML } from '@/lib/security/xss';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseKey = supabaseServiceKey || supabaseAnonKey;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration for course messages API');
}

const supabase = createClient(supabaseUrl, supabaseKey as string);

type UserRow = {
  id: string;
  name: string | null;
  role: 'student' | 'teacher' | 'admin' | string | null;
  phone?: string | null;
  student_phone?: string | null;
};

async function getUserById(userId: string): Promise<UserRow | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id,name,role,phone,student_phone')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user in /api/course-messages:', error);
    return null;
  }

  return (data as any) || null;
}

async function getCourseInstructorId(courseId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('courses')
    .select('instructor_id')
    .eq('id', courseId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching course instructor_id in /api/course-messages:', error);
    return null;
  }

  return data?.instructor_id ? String(data.instructor_id) : null;
}

function normalizePhone(value: string | null | undefined): string {
  return String(value || '')
    .replace(/\s+/g, '')
    .replace(/^\+?2/, '')
    .trim();
}

function studentPhoneMatchesUser(user: UserRow, headerPhone: string | null): boolean {
  const header = normalizePhone(headerPhone);
  if (!header) return false;

  const userPhone = normalizePhone(user.phone || null);
  const userStudentPhone = normalizePhone((user as any).student_phone || null);

  return header === userPhone || header === userStudentPhone;
}

async function isEnrollmentActive(courseId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('enrollments')
    .select('is_active')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error checking enrollment in /api/course-messages:', error);
    return false;
  }

  if (!data) return false;
  return data.is_active !== false;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const courseId = searchParams.get('courseId');
    const userId = searchParams.get('userId');

    const roleCookie = request.cookies.get('user-role')?.value;
    const authCookie =
      request.cookies.get('auth-token')?.value || request.cookies.get('auth_token')?.value;
    const cookieUserId = request.cookies.get('user-id')?.value;

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!authCookie || !roleCookie || !cookieUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (String(cookieUserId) !== String(userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const user = await getUserById(userId);
    if (!user || !user.role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = String(user.role);

    if (String(roleCookie) !== role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const headerPhone = request.headers.get('x-student-phone');
    const hasPhoneOnUser = normalizePhone(user.phone || null) || normalizePhone((user as any).student_phone || null);
    if (role === 'student' && hasPhoneOnUser && !studentPhoneMatchesUser(user, headerPhone)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const instructorId = await getCourseInstructorId(courseId);
    if (!instructorId) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (role === 'teacher') {
      if (String(user.id) !== String(instructorId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (role === 'student') {
      const enrolled = await isEnrollmentActive(courseId, userId);
      if (!enrolled) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    let query = supabase
      .from('course_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(200);

    query = query.eq('course_id', courseId).eq('teacher_id', instructorId);

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
    // Validate request body using Zod
    const validation = await validateRequest(request, courseMessageCreateSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { courseId, userId, content: rawContent } = validation.data;

    // Sanitize content to prevent XSS
    const content = sanitizeHTML(rawContent);

    const roleCookie = request.cookies.get('user-role')?.value;
    const authCookie =
      request.cookies.get('auth-token')?.value || request.cookies.get('auth_token')?.value;
    const cookieUserId = request.cookies.get('user-id')?.value;

    if (!authCookie || !roleCookie || !cookieUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (String(cookieUserId) !== String(userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const user = await getUserById(String(userId));
    if (!user || !user.role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = String(user.role);

    if (String(roleCookie) !== role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const headerPhone = request.headers.get('x-student-phone');
    const hasPhoneOnUser = normalizePhone(user.phone || null) || normalizePhone((user as any).student_phone || null);
    if (role === 'student' && hasPhoneOnUser && !studentPhoneMatchesUser(user, headerPhone)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const instructorId = await getCourseInstructorId(courseId);
    if (!instructorId) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (role === 'teacher') {
      if (String(user.id) !== String(instructorId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (role === 'student') {
      const enrolled = await isEnrollmentActive(courseId, String(userId));
      if (!enrolled) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const senderRole = role === 'admin' ? 'teacher' : role;
    if (senderRole !== 'teacher' && senderRole !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const senderName =
      role === 'admin'
        ? 'مستر معتصم'
        : user.name || (senderRole === 'teacher' ? 'المدرس' : 'طالب');

    const { data, error } = await supabase
      .from('course_messages')
      .insert({
        course_id: courseId,
        teacher_id: instructorId,
        sender_id: String(userId),
        sender_name: senderName,
        sender_role: senderRole,
        content: content, // Already sanitized
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

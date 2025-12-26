import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration for teacher students API. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface StudentRow {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string | null;
  progress: number | null;
  last_accessed: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const courseIdsParam = searchParams.get('courseIds');
    const teacherIdRaw = searchParams.get('teacherId');
    const teacherId = teacherIdRaw && teacherIdRaw.trim().length > 0 ? teacherIdRaw.trim() : undefined;

     const roleCookie = request.cookies.get('user-role')?.value;
     const authCookie =
       request.cookies.get('auth-token')?.value || request.cookies.get('auth_token')?.value;
     const cookieUserId = request.cookies.get('user-id')?.value;

     if (!authCookie || !roleCookie || !cookieUserId) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }

     if (roleCookie !== 'teacher' && roleCookie !== 'admin') {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
     }

     const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

     const isAdmin = roleCookie === 'admin';
     const isTeacher = roleCookie === 'teacher';

     if (isTeacher && teacherId && String(teacherId) !== String(cookieUserId)) {
       return NextResponse.json({ error: 'forbidden' }, { status: 403 });
     }

     const effectiveTeacherId = isAdmin
       ? teacherId && uuidRegex.test(String(teacherId))
         ? teacherId
         : undefined
       : (teacherId || cookieUserId);

    if (!courseIdsParam && !effectiveTeacherId) {
      return NextResponse.json(
        { error: 'courseIds or teacherId is required' },
        { status: 400 }
      );
    }

    let courseIds: string[] = [];

    if (courseIdsParam) {
      courseIds = courseIdsParam
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
    }

    // في حال لم تُرسل courseIds لكن لدينا teacherId، نجلب كورسات هذا المدرس أولاً
    if (!courseIds.length && effectiveTeacherId) {
      if (!uuidRegex.test(String(effectiveTeacherId))) {
        return NextResponse.json(
          { error: 'Invalid teacherId: expected UUID' },
          { status: 400 }
        );
      }

      const { data: teacherCourses, error: teacherCoursesError } = await supabase
        .from('courses')
        .select('id')
        .eq('instructor_id', effectiveTeacherId);

      if (teacherCoursesError) {
        console.error('Error loading teacher courses in /api/teacher/students:', teacherCoursesError);
        return NextResponse.json(
          { error: 'Failed to load teacher courses' },
          { status: 500 }
        );
      }

      courseIds = (teacherCourses || []).map((c: any) => c.id as string);
    }

    // إذا أُرسلت courseIds مباشرة، نُقيّدها بكورسات المدرس/الأدمن
    if (courseIds.length && effectiveTeacherId) {
      if (!uuidRegex.test(String(effectiveTeacherId))) {
        return NextResponse.json(
          { error: 'Invalid teacherId: expected UUID' },
          { status: 400 }
        );
      }

      const { data: allowedCourses, error: allowedError } = await supabase
        .from('courses')
        .select('id')
        .in('id', courseIds as any)
        .eq('instructor_id', effectiveTeacherId);

      if (allowedError) {
        console.error('Error verifying courseIds ownership in /api/teacher/students:', allowedError);
        return NextResponse.json(
          { error: 'Failed to verify courses ownership' },
          { status: 500 }
        );
      }

      courseIds = (allowedCourses || []).map((c: any) => String(c.id));
    }

    if (!courseIds.length) {
      return NextResponse.json({ students: [] });
    }

    // جلب التسجيلات في هذه الكورسات من جدول enrollments
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('id, user_id, course_id, enrolled_at, progress, last_accessed')
      .in('course_id', courseIds as any);

    if (enrollmentsError) {
      console.error('Error loading enrollments in /api/teacher/students:', enrollmentsError);
      return NextResponse.json(
        { error: 'Failed to load enrollments' },
        { status: 500 }
      );
    }

    const safeEnrollments: StudentRow[] = (enrollments || []) as any[];

    if (!safeEnrollments.length) {
      return NextResponse.json({ students: [] });
    }

    const userIds = Array.from(
      new Set(
        safeEnrollments
          .map((e) => e.user_id)
          .filter((id): id is string => !!id)
      )
    );

    const { data: usersRows, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, avatar_url, parent_phone, student_phone, phone')
      .in('id', userIds as any);

    if (usersError) {
      console.error('Error loading users for teacher students:', usersError);
      return NextResponse.json(
        { error: 'Failed to load students profiles' },
        { status: 500 }
      );
    }

    const { data: coursesRows, error: coursesError } = await supabase
      .from('courses')
      .select('id, title')
      .in('id', courseIds as any);

    if (coursesError) {
      console.error('Error loading courses for teacher students:', coursesError);
      return NextResponse.json(
        { error: 'Failed to load courses' },
        { status: 500 }
      );
    }

    const courseMap = new Map<string, string>(
      (coursesRows || []).map((c: any) => [String(c.id), c.title as string])
    );

    const usersMap = new Map<string, any>(
      (usersRows || []).map((u: any) => [String(u.id), u])
    );

    const students = safeEnrollments.map((enr) => {
      const u = usersMap.get(String(enr.user_id));
      const courseTitle = courseMap.get(String(enr.course_id)) || '';

      const enrolledAt = enr.enrolled_at ? new Date(enr.enrolled_at) : null;
      const lastAccessed = enr.last_accessed ? new Date(enr.last_accessed) : null;

      return {
        id: enr.id,
        userId: enr.user_id,
        courseId: enr.course_id,
        name: (u && u.name) || 'طالب',
        email: (u && u.email) || '',
        avatar: (u && (u.avatar_url || u.avatar)) || '/placeholder-avatar.png',
        parentPhone: (u && (u.parent_phone || u.phone || u.student_phone)) || '',
        enrolledDate: enrolledAt
          ? enrolledAt.toLocaleDateString('ar-EG')
          : '',
        progress: Number(enr.progress ?? 0),
        lastActive: lastAccessed
          ? lastAccessed.toLocaleString('ar-EG')
          : 'غير معروف',
        courseName: courseTitle,
        enrolledAtRaw: enr.enrolled_at,
        lastActiveAt: enr.last_accessed,
      };
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Unexpected error in /api/teacher/students:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

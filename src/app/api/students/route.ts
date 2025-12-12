import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase configuration for /api/students. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// إرجاع جميع الطلاب المسجّلين (role = 'student')
// مع حساب عدد الكورسات والتقدم من جدول enrollments إن وُجدت تسجيلات
export async function GET() {
  try {
    // أولاً: جلب جميع المستخدمين من نوع طالب
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(
        'id, name, email, phone, student_phone, parent_phone, grade_level, avatar_url, profile_picture, created_at, updated_at, role'
      )
      .eq('role', 'student')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Error fetching users for /api/students:', usersError);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    const userRows = (users || []).filter((u: any) => !!u && !!u.id);

    if (userRows.length === 0) {
      return NextResponse.json([]);
    }

    const userIds = userRows.map((u: any) => u.id as string);

    // ثانياً: جلب تسجيلات الكورسات لهؤلاء الطلاب (إن وجدت)
    let enrollmentRows: any[] = [];
    try {
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('user_id, course_id, progress, is_active, enrolled_at, last_accessed')
        .in('user_id', userIds as any);

      if (enrollmentsError) {
        console.error('Error fetching enrollments for /api/students:', enrollmentsError);
      } else {
        enrollmentRows = (enrollments || []) as any[];
      }
    } catch (enrollError) {
      console.error('Unexpected error while fetching enrollments for /api/students:', enrollError);
    }

    // تجميع بيانات التسجيلات لكل طالب
    type Aggregated = {
      enrolledCourses: number;
      totalProgress: number;
      lastActive?: string;
    };

    const byStudentEnrollments = new Map<string, Aggregated>();

    for (const row of enrollmentRows) {
      const userId = row.user_id as string | null | undefined;
      if (!userId) continue;

      // نعتبر فقط التسجيلات النشطة في عدّ الكورسات
      const isActive = row.is_active !== false;
      const progress = typeof row.progress === 'number' ? row.progress : 0;

      const existing = byStudentEnrollments.get(userId) || {
        enrolledCourses: 0,
        totalProgress: 0,
        lastActive: undefined as string | undefined,
      };

      if (isActive && row.course_id) {
        existing.enrolledCourses += 1;
      }

      existing.totalProgress += progress;

      const candidateLast = row.last_accessed || row.enrolled_at;
      if (candidateLast) {
        const currentLastTime = existing.lastActive
          ? new Date(existing.lastActive).getTime()
          : 0;
        const candidateTime = new Date(candidateLast).getTime();
        if (candidateTime > currentLastTime) {
          existing.lastActive = candidateLast;
        }
      }

      byStudentEnrollments.set(userId, existing);
    }

    // دمج بيانات المستخدمين مع بيانات التسجيلات
    const items = userRows.map((u: any) => {
      const agg = byStudentEnrollments.get(String(u.id));

      const enrolledCourses = agg?.enrolledCourses ?? 0;
      const totalProgressRaw = agg?.totalProgress ?? 0;
      const avgProgress = enrolledCourses > 0
        ? Math.round(totalProgressRaw / enrolledCourses)
        : 0;

      return {
        id: String(u.id),
        name: u.name || 'طالب',
        email: u.email || '',
        phone: u.student_phone || u.studentPhone || u.phone || '',
        parentPhone: u.parent_phone || '',
        grade: u.grade_level || '',
        avatar: u.avatar_url || u.profile_picture || '/placeholder-avatar.png',
        joinDate: u.created_at || new Date().toISOString(),
        lastActive: agg?.lastActive || u.updated_at || u.created_at,
        enrolledCourses,
        totalProgress: avgProgress,
      };
    });

    return NextResponse.json(items);
  } catch (e: any) {
    console.error('Unexpected error in /api/students:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
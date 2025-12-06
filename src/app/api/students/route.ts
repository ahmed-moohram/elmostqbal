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

// إرجاع جميع الطلاب المشتركين فعلياً في كورس واحد على الأقل
// نعتمد على جدول enrollments + users بدون استخدام join مباشر لتفادي أخطاء العلاقات
export async function GET() {
  try {
    // أولاً: جلب جميع التسجيلات النشطة
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('id, user_id, course_id, progress, is_active, enrolled_at, last_accessed')
      .eq('is_active', true);

    if (enrollmentsError) {
      console.error('Error fetching enrollments for /api/students:', enrollmentsError);
      return NextResponse.json({ error: enrollmentsError.message }, { status: 500 });
    }

    const enrollmentRows = (enrollments || []) as any[];

    if (enrollmentRows.length === 0) {
      return NextResponse.json([]);
    }

    // استخراج معرّفات الطلاب المميزة
    const userIds = Array.from(
      new Set(
        enrollmentRows
          .map((e: any) => e.user_id)
          .filter((id: any) => !!id)
      )
    );

    if (userIds.length === 0) {
      return NextResponse.json([]);
    }

    // ثانياً: جلب بيانات هؤلاء الطلاب من جدول users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(
        'id, name, email, phone, student_phone, parent_phone, grade_level, avatar_url, profile_picture, created_at, updated_at'
      )
      .in('id', userIds as any);

    if (usersError) {
      console.error('Error fetching users for /api/students:', usersError);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    const usersMap = new Map<string, any>();
    (users || []).forEach((u: any) => {
      if (u && u.id) {
        usersMap.set(String(u.id), u);
      }
    });

    // تجميع البيانات حسب الطالب
    const byStudent = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
        phone: string;
        parentPhone?: string;
        grade?: string;
        avatar?: string;
        joinDate: string;
        lastActive?: string;
        enrolledCourses: number;
        totalProgress: number;
      }
    >();

    for (const row of enrollmentRows) {
      const u = usersMap.get(String(row.user_id));
      if (!u || !u.id) continue;

      const studentId = String(u.id);
      const existing = byStudent.get(studentId);

      const courseId = row.course_id;
      const progress = typeof row.progress === 'number' ? row.progress : 0;

      if (!existing) {
        byStudent.set(studentId, {
          id: studentId,
          name: u.name || 'طالب',
          email: u.email || '',
          phone: u.student_phone || u.studentPhone || u.phone || '',
          parentPhone: u.parent_phone || '',
          grade: u.grade_level || '',
          avatar: u.avatar_url || u.profile_picture || '/placeholder-avatar.png',
          joinDate: u.created_at || row.enrolled_at || new Date().toISOString(),
          lastActive: u.updated_at || row.last_accessed || row.enrolled_at,
          enrolledCourses: courseId ? 1 : 0,
          totalProgress: progress,
        });
      } else {
        // تحديث عدد الكورسات وإجمالي التقدم
        const already = existing.enrolledCourses;
        const newCount = courseId ? already + 1 : already;
        const newTotalProgress = existing.totalProgress + progress;

        existing.enrolledCourses = newCount;
        existing.totalProgress = newTotalProgress;

        // تحديث آخر نشاط إن وُجد تاريخ أحدث
        const currentLast = existing.lastActive ? new Date(existing.lastActive).getTime() : 0;
        const candidateLast = row.last_accessed || row.enrolled_at;
        if (candidateLast) {
          const candidateTime = new Date(candidateLast).getTime();
          if (candidateTime > currentLast) {
            existing.lastActive = candidateLast;
          }
        }
      }
    }

    // حساب متوسط التقدم لكل طالب
    const items = Array.from(byStudent.values()).map((s) => ({
      ...s,
      totalProgress:
        s.enrolledCourses > 0
          ? Math.round(s.totalProgress / s.enrolledCourses)
          : 0,
    }));

    return NextResponse.json(items);
  } catch (e: any) {
    console.error('Unexpected error in /api/students:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
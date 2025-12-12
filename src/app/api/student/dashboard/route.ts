import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('❌ Missing Supabase configuration for /api/student/dashboard. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function calculateOverallProgress(enrollments: any[]): number {
  if (!enrollments || enrollments.length === 0) return 0;

  const totalProgress = enrollments.reduce((sum: number, enrollment: any) => {
    return sum + (enrollment.progress || 0);
  }, 0);

  return Math.round(totalProgress / enrollments.length);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // جلب التسجيلات النشطة للطالب
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select(`
        *,
        course:courses(*)
      `)
      .eq('user_id', userId)
      .not('is_active', 'eq', false);

    if (enrollmentsError) {
      console.error('Error fetching enrollments in /api/student/dashboard:', enrollmentsError);
      return NextResponse.json(
        { error: 'Failed to load enrollments' },
        { status: 500 }
      );
    }

    // جلب الشهادات
    const { data: certificates, error: certificatesError } = await supabase
      .from('certificates')
      .select('*')
      .eq('user_id', userId);

    if (certificatesError) {
      console.warn('Error fetching certificates (ignored):', certificatesError.message);
    }

    // جلب النقاط
    const { data: userPointsData, error: userPointsError } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .limit(1);

    if (userPointsError) {
      console.warn('Error fetching user_points (ignored):', userPointsError.message);
    }

    const userPoints = Array.isArray(userPointsData) && userPointsData.length > 0
      ? userPointsData[0]
      : null;

    // جلب الإنجازات المكتملة
    const { data: achievements, error: achievementsError } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievements(*)
      `)
      .eq('user_id', userId)
      .eq('is_completed', true);

    if (achievementsError) {
      console.warn('Error fetching user achievements (ignored):', achievementsError.message);
    }

    // حساب عدد الدروس في كل كورس مسجَّل فيه الطالب حتى يمكن للواجهة عرض 0/عدد_الدروس الحقيقي
    let enrichedEnrollments = enrollments || [];

    try {
      const enrolledCourseIdsForLessons = (enrollments || [])
        .map((enrollment: any) => enrollment.course_id)
        .filter((id: string | null | undefined) => !!id);

      if (enrolledCourseIdsForLessons.length > 0) {
        const { data: lessons, error: lessonsError } = await supabase
          .from('lessons')
          .select('id, course_id')
          .in('course_id', enrolledCourseIdsForLessons as any);

        if (lessonsError) {
          console.warn('Error fetching lessons for student dashboard (ignored):', lessonsError.message);
        } else if (lessons) {
          const counts = new Map<string, number>();
          lessons.forEach((l: any) => {
            const key = String(l.course_id);
            counts.set(key, (counts.get(key) || 0) + 1);
          });

          enrichedEnrollments = (enrollments || []).map((enr: any) => {
            const c = enr.course || {};
            const key = String(enr.course_id || c.id || '');
            const lessonsCount = counts.get(key) ?? c.lessons_count ?? c.total_lessons ?? 0;

            return {
              ...enr,
              course: c
                ? {
                    ...c,
                    lessons_count: lessonsCount,
                    total_lessons: lessonsCount,
                  }
                : c,
            };
          });
        }
      }
    } catch (lessonsAggError) {
      console.error('Error aggregating lessons for student dashboard (ignored):', lessonsAggError);
    }

    // جلب الجلسات والاختبارات القادمة المرتبطة بكورسات الطالب
    let upcomingEvents: any[] = [];
    try {
      const enrolledCourseIds = (enrichedEnrollments || [])
        .map((enrollment: any) => enrollment.course_id)
        .filter((id: string | null | undefined) => !!id);

      if (enrolledCourseIds.length > 0) {
        const nowIso = new Date().toISOString();

        const { data: liveSessions, error: liveError } = await supabase
          .from('live_sessions')
          .select('id, title, scheduled_at, status')
          .in('course_id', enrolledCourseIds as any)
          .gte('scheduled_at', nowIso)
          .order('scheduled_at', { ascending: true })
          .limit(10);

        if (liveError) {
          console.warn('Error fetching live_sessions (ignored):', liveError.message);
        }

        const { data: upcomingAssignments, error: assignmentsError } = await supabase
          .from('assignments')
          .select('id, title, due_date')
          .in('course_id', enrolledCourseIds as any)
          .gte('due_date', nowIso)
          .order('due_date', { ascending: true })
          .limit(10);

        if (assignmentsError) {
          console.warn('Error fetching assignments (ignored):', assignmentsError.message);
        }

        const liveEvents = (liveSessions || []).map((session: any) => ({
          id: session.id,
          title: session.title,
          date: session.scheduled_at,
          time: null,
          type: 'live' as const,
        }));

        const assignmentEvents = (upcomingAssignments || []).map((assignment: any) => ({
          id: assignment.id,
          title: assignment.title,
          date: assignment.due_date,
          time: null,
          // نعتبر جميع الواجبات/الاختبارات كأحداث من نوع exam لعرض "عرض التفاصيل" في الواجهة
          type: 'exam' as const,
        }));

        upcomingEvents = [...liveEvents, ...assignmentEvents]
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 10);
      }
    } catch (eventsError) {
      console.error('Error fetching upcoming events in /api/student/dashboard:', eventsError);
    }

    const overallProgress = calculateOverallProgress(enrichedEnrollments || []);

    return NextResponse.json({
      activeCourses: enrichedEnrollments || [],
      certificates: certificates || [],
      points: userPoints?.total_points || 0,
      level: userPoints?.current_level || 1,
      achievements: achievements || [],
      overallProgress,
      upcomingEvents,
    });
  } catch (error) {
    console.error('Error in /api/student/dashboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

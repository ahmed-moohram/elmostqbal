import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('❌ Missing Supabase configuration for /api/student/dashboard. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHONE_REGEX = /^\d{7,15}$/;

function calculateOverallProgress(enrollments: any[]): number {
  if (!enrollments || enrollments.length === 0) return 0;

  const totalProgress = enrollments.reduce((sum: number, enrollment: any) => {
    return sum + (enrollment.progress || 0);
  }, 0);

  return Math.round(totalProgress / enrollments.length);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const requestedUserId = String(userId).trim();
    let effectiveUserId = requestedUserId;
    let studentPhoneForPayments: string | null = null;

    if (!UUID_REGEX.test(effectiveUserId)) {
      if (PHONE_REGEX.test(effectiveUserId)) {
        studentPhoneForPayments = effectiveUserId;

        try {
          const { data: resolvedUser, error: resolveErr } = await supabase
            .from('users')
            .select('id')
            .or(
              `phone.eq.${studentPhoneForPayments},student_phone.eq.${studentPhoneForPayments},parent_phone.eq.${studentPhoneForPayments},mother_phone.eq.${studentPhoneForPayments}`
            )
            .maybeSingle();

          if (!resolveErr && resolvedUser?.id) {
            effectiveUserId = String(resolvedUser.id);
          }
        } catch {
          // ignore
        }
      }
    }

    const hasUuid = UUID_REGEX.test(effectiveUserId);

    // جلب التسجيلات النشطة للطالب من جدول enrollments
    let enrollments: any[] = [];

    if (hasUuid) {
      const { data: legacyEnrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(
            *,
            instructor_user:users!courses_instructor_id_fkey(
              id,
              name,
              avatar_url,
              profile_picture
            )
          )
        `)
        .eq('user_id', effectiveUserId)
        .not('is_active', 'eq', false);

      if (enrollmentsError) {
        console.error('Error fetching enrollments in /api/student/dashboard:', enrollmentsError);
        return NextResponse.json(
          { error: 'Failed to load enrollments' },
          { status: 500 }
        );
      }

      enrollments = legacyEnrollments || [];
    }

    // دمج التسجيلات من نظام الدفع الجديد course_enrollments في حال عدم وجودها في enrollments
    try {
      const paymentEnrollments = hasUuid
        ? (
            await supabase
              .from('course_enrollments')
              .select(`
                id,
                student_id,
                course_id,
                is_active,
                created_at
              `)
              .eq('student_id', effectiveUserId)
              .eq('is_active', true)
          )
        : { data: null, error: null };

      const { data: paymentEnrollmentsData, error: courseEnrollError } = paymentEnrollments as any;

      if (courseEnrollError) {
        console.warn(
          'Error fetching course_enrollments for /api/student/dashboard (ignored):',
          courseEnrollError.message
        );
      } else if (paymentEnrollmentsData && paymentEnrollmentsData.length > 0) {
        const courseIdsForEnrollments = Array.from(
          new Set(
            (paymentEnrollmentsData || [])
              .map((ce: any) => ce?.course_id)
              .filter((cid: any) => !!cid)
              .map((cid: any) => String(cid))
          )
        );

        const courseMap = new Map<string, any>();
        if (courseIdsForEnrollments.length > 0) {
          const { data: coursesForEnrollments, error: coursesForEnrollmentsError } = await supabase
            .from('courses')
            .select(
              `*, instructor_user:users!courses_instructor_id_fkey(
                id,
                name,
                avatar_url,
                profile_picture
              )`
            )
            .in('id', courseIdsForEnrollments as any);

          if (coursesForEnrollmentsError) {
            console.warn(
              'Error fetching courses for course_enrollments in /api/student/dashboard (ignored):',
              coursesForEnrollmentsError.message
            );
          } else {
            (coursesForEnrollments || []).forEach((c: any) => {
              if (c?.id) courseMap.set(String(c.id), c);
            });
          }
        }

        const existingCourseIds = new Set(
          (enrollments || []).map((enr: any) => String(enr.course_id))
        );

        const extraEnrollments = paymentEnrollmentsData
          .filter((ce: any) => !existingCourseIds.has(String(ce.course_id)))
          .map((ce: any) => ({
            id: ce.id,
            user_id: ce.student_id,
            course_id: ce.course_id,
            status: 'active',
            progress: 0,
            is_active: ce.is_active ?? true,
            enrolled_at: ce.created_at,
            completed_at: null,
            course: courseMap.get(String(ce.course_id)) || null,
          }));

        enrollments = [...enrollments, ...extraEnrollments];
      }
    } catch (courseEnrollAggError) {
      console.error(
        'Error aggregating course_enrollments for /api/student/dashboard (ignored):',
        courseEnrollAggError
      );
    }

    // دمج الكورسات التي تمت الموافقة على طلب الدفع لها مباشرةً من جدول payment_requests
    // هذا يضمن ظهور أي كورس مدفوع حتى لو فشل إنشاء صف في enrollments أو course_enrollments
    try {
      if (!studentPhoneForPayments && hasUuid) {
        const { data: userRow, error: userError } = await supabase
          .from('users')
          .select('id, phone, student_phone')
          .eq('id', effectiveUserId)
          .maybeSingle();

        if (userError) {
          console.warn('Error fetching user phone for student dashboard (ignored):', userError.message);
        }

        studentPhoneForPayments = (userRow as any)?.phone || (userRow as any)?.student_phone || null;
      }

      if (studentPhoneForPayments) {
        // جلب طلبات الدفع المعتمدة لهذا الطالب بناءً على رقم الهاتف
        const { data: approvedPayments, error: paymentsError } = await supabase
          .from('payment_requests')
          .select('id, course_id, status, student_phone, payment_phone, approved_at, created_at')
          .or(`student_phone.eq.${studentPhoneForPayments},payment_phone.eq.${studentPhoneForPayments}`)
          .eq('status', 'approved');

        if (paymentsError) {
          console.warn(
            'Error fetching payment_requests for /api/student/dashboard (ignored):',
            paymentsError.message
          );
        } else if (approvedPayments && approvedPayments.length > 0) {
          const existingCourseIds = new Set(
            (enrollments || []).map((enr: any) => String(enr.course_id))
          );

          // الكورسات التي لا تزال غير موجودة في قائمة التسجيلات
          const extraPaymentRequests = approvedPayments.filter(
            (pr: any) => pr.course_id && !existingCourseIds.has(String(pr.course_id))
          );

          if (extraPaymentRequests.length > 0) {
            const courseIdsForPayments = Array.from(
              new Set(
                extraPaymentRequests
                  .map((pr: any) => pr.course_id)
                  .filter((cid: string | null | undefined) => !!cid)
                  .map((cid: any) => String(cid))
              )
            );

            // جلب بيانات الكورسات المرتبطة بهذه الطلبات
            const { data: paymentCourses, error: paymentCoursesError } = await supabase
              .from('courses')
              .select(
                `*, instructor_user:users!courses_instructor_id_fkey(
                  id,
                  name,
                  avatar_url,
                  profile_picture
                )`
              )
              .in('id', courseIdsForPayments as any);

            if (paymentCoursesError) {
              console.warn(
                'Error fetching courses for payment_requests in /api/student/dashboard (ignored):',
                paymentCoursesError.message
              );
            }

            const courseMap = new Map<string, any>();
            (paymentCourses || []).forEach((c: any) => {
              courseMap.set(String(c.id), c);
            });

            const syntheticEnrollments = extraPaymentRequests.map((pr: any) => {
              const courseIdStr = String(pr.course_id);
              const course = courseMap.get(courseIdStr) || null;

              return {
                id: `payment_${pr.id}`,
                user_id: effectiveUserId,
                course_id: pr.course_id,
                status: 'active',
                progress: 0,
                is_active: true,
                enrolled_at: pr.approved_at || pr.created_at,
                completed_at: null,
                course,
              };
            });

            enrollments = [...enrollments, ...syntheticEnrollments];
          }
        }
      }
    } catch (paymentAggError) {
      console.error(
        'Error aggregating payment_requests for /api/student/dashboard (ignored):',
        paymentAggError
      );
    }

    // جلب الشهادات
    const certificatesResp = hasUuid
      ? await supabase
          .from('certificates')
          .select('*')
          .eq('user_id', effectiveUserId)
      : { data: [], error: null };

    const { data: certificates, error: certificatesError } = certificatesResp as any;

    if (certificatesError) {
      console.warn('Error fetching certificates (ignored):', certificatesError.message);
    }

    // جلب النقاط
    const userPointsResp = hasUuid
      ? await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', effectiveUserId)
          .limit(1)
      : { data: [], error: null };

    const { data: userPointsData, error: userPointsError } = userPointsResp as any;

    if (userPointsError) {
      console.warn('Error fetching user_points (ignored):', userPointsError.message);
    }

    const userPoints = Array.isArray(userPointsData) && userPointsData.length > 0
      ? userPointsData[0]
      : null;

    // جلب الإنجازات المكتملة
    const achievementsResp = hasUuid
      ? await supabase
          .from('user_achievements')
          .select(`
            *,
            achievement:achievements(*)
          `)
          .eq('user_id', effectiveUserId)
          .eq('is_completed', true)
      : { data: [], error: null };

    const { data: achievements, error: achievementsError } = achievementsResp as any;

    if (achievementsError) {
      console.warn('Error fetching user achievements (ignored):', achievementsError.message);
    }

    // حساب عدد الدروس في كل كورس مسجَّل فيه الطالب حتى يمكن للواجهة عرض 0/عدد_الدروس الحقيقي
    let enrichedEnrollments = enrollments || [];

    // إضافة instructor_name مشتق للكورسات حتى تظل الواجهة تعمل بدون عمود courses.instructor_name
    enrichedEnrollments = (enrichedEnrollments || []).map((enr: any) => {
      const course = enr?.course || null;
      if (!course) return enr;

      const derivedInstructorName =
        course?.instructor_name ||
        course?.instructor_user?.name ||
        'غير محدد';

      return {
        ...enr,
        course: {
          ...course,
          instructor_name: derivedInstructorName,
        },
      };
    });

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
        }
      }
    } catch (lessonsAggError) {
      console.error('Error aggregating lessons for student dashboard (ignored):', lessonsAggError);
    }

    // إخفاء الكورسات المحذوفة أو غير النشطة أو التي لا تحتوي على عنوان من قائمة الكورسات النشطة
    enrichedEnrollments = (enrichedEnrollments || []).filter((enr: any) => {
      const course = enr.course;
      if (!course) return false;

      const title = (course.title || '').trim();
      if (!title) return false;

      if (course.is_active === false) return false;

      return true;
    });

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

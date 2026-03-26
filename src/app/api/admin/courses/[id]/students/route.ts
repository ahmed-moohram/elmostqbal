import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase configuration. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface UnifiedEnrollment {
  userId: string;
  enrolledAt: string | null;
  progress: number;
  fallbackName?: string;
  fallbackPhone?: string;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const courseId = params.id;

    if (!courseId) {
      return NextResponse.json({ error: 'Missing course id' }, { status: 400 });
    }

    const roleCookie = request.cookies.get('user-role')?.value;
    const cookieUserId = request.cookies.get('user-id')?.value;

    if (!roleCookie || !cookieUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (roleCookie !== 'admin' && roleCookie !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, instructor_id')
      .eq('id', courseId)
      .maybeSingle();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (
      roleCookie === 'teacher' &&
      uuidRegex.test(String(course.instructor_id)) &&
      String(course.instructor_id) !== String(cookieUserId)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const enrollmentsMap = new Map<string, UnifiedEnrollment>();

    let courseEnrollments: any[] | null = null;
    let courseEnrollmentsError: any = null;

    {
      const res = await supabase
        .from('course_enrollments')
        .select('student_id, enrolled_at, progress_percentage')
        .eq('course_id', courseId)
        .eq('is_active', true);
      courseEnrollments = res.data as any;
      courseEnrollmentsError = res.error as any;
    }

    if (courseEnrollmentsError || (Array.isArray(courseEnrollments) && courseEnrollments.length === 0)) {
      const retry = await supabase
        .from('course_enrollments')
        .select('student_id, enrolled_at, progress_percentage')
        .eq('course_id', courseId);
      if (!retry.error) {
        courseEnrollments = retry.data as any;
        courseEnrollmentsError = null;
      }
    }

    if (courseEnrollmentsError) {
      console.error(
        'Error loading course_enrollments in /api/admin/courses/[id]/students:',
        courseEnrollmentsError,
      );
    }

    (courseEnrollments || []).forEach((row: any) => {
      const userId = String(row.student_id || '').trim();
      if (!userId) return;

      enrollmentsMap.set(userId, {
        userId,
        enrolledAt: row.enrolled_at ?? null,
        progress: Number(row.progress_percentage ?? 0),
      });
    });

    let legacyEnrollments: any[] | null = null;
    let legacyError: any = null;

    {
      const res = await supabase
        .from('enrollments')
        .select('user_id, enrolled_at, progress')
        .eq('course_id', courseId)
        .eq('is_active', true);
      legacyEnrollments = res.data as any;
      legacyError = res.error as any;
    }

    if (legacyError || (Array.isArray(legacyEnrollments) && legacyEnrollments.length === 0)) {
      const retry = await supabase
        .from('enrollments')
        .select('user_id, enrolled_at, progress')
        .eq('course_id', courseId);
      if (!retry.error) {
        legacyEnrollments = retry.data as any;
        legacyError = null;
      }
    }

    if (legacyError) {
      console.error('Error loading enrollments in /api/admin/courses/[id]/students:', legacyError);
    }

    (legacyEnrollments || []).forEach((row: any) => {
      const userId = String(row.user_id || '').trim();
      if (!userId) return;

      if (!enrollmentsMap.has(userId)) {
        enrollmentsMap.set(userId, {
          userId,
          enrolledAt: row.enrolled_at ?? null,
          progress: Number(row.progress ?? 0),
        });
      }
    });

    if (enrollmentsMap.size === 0) {
      const { data: paymentRequests, error: paymentRequestsError } = await supabase
        .from('payment_requests')
        .select('id, student_id, student_name, student_phone, status, approved_at, created_at')
        .eq('course_id', courseId)
        .eq('status', 'approved');

      if (paymentRequestsError) {
        console.error('Error loading payment_requests in /api/admin/courses/[id]/students:', paymentRequestsError);
      }

      const approved = (paymentRequests || []) as any[];
      const phones = Array.from(
        new Set(
          approved
            .map((p) => String(p.student_phone || '').trim())
            .filter(Boolean),
        ),
      );

      let phoneUsers: any[] = [];
      let studentPhoneUsers: any[] = [];

      if (phones.length) {
        const r1 = await supabase
          .from('users')
          .select('id, name, email, phone, parent_phone, mother_phone, student_phone')
          .in('phone', phones as any);
        phoneUsers = (r1.data as any[]) || [];

        const r2 = await supabase
          .from('users')
          .select('id, name, email, phone, parent_phone, mother_phone, student_phone')
          .in('student_phone', phones as any);
        studentPhoneUsers = (r2.data as any[]) || [];
      }

      const phoneToUser = new Map<string, any>();

      [...phoneUsers, ...studentPhoneUsers].forEach((u: any) => {
        const p1 = String(u.phone || '').trim();
        const p2 = String(u.student_phone || '').trim();
        if (p1) phoneToUser.set(p1, u);
        if (p2) phoneToUser.set(p2, u);
      });

      approved.forEach((p: any) => {
        const studentPhone = String(p.student_phone || '').trim();
        const match = studentPhone ? phoneToUser.get(studentPhone) : null;
        const userId = match?.id || (uuidRegex.test(String(p.student_id || '')) ? String(p.student_id) : `payment:${p.id}`);

        if (!enrollmentsMap.has(String(userId))) {
          enrollmentsMap.set(String(userId), {
            userId: String(userId),
            enrolledAt: p.approved_at || p.created_at || null,
            progress: 0,
            fallbackName: String(p.student_name || '').trim() || undefined,
            fallbackPhone: studentPhone || undefined,
          });
        }
      });
    }

    const unifiedEnrollments = Array.from(enrollmentsMap.values());

    if (!unifiedEnrollments.length) {
      return NextResponse.json({ students: [] });
    }

    const realUserIds = unifiedEnrollments
      .map((e) => String(e.userId))
      .filter((id) => uuidRegex.test(String(id)));

    const tryLoadSectionIds = async (): Promise<string[]> => {
      const res1 = await supabase.from('sections').select('id').eq('course_id', courseId);
      if (!res1.error) {
        return (res1.data || []).map((s: any) => String(s.id)).filter(Boolean);
      }

      const res2 = await supabase.from('course_sections').select('id').eq('course_id', courseId);
      if (!res2.error) {
        return (res2.data || []).map((s: any) => String(s.id)).filter(Boolean);
      }

      return [];
    };

    let lessonIds: string[] = [];

    {
      const lessonsRes = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', courseId);

      if (!lessonsRes.error) {
        lessonIds = (lessonsRes.data || []).map((l: any) => String(l.id)).filter(Boolean);
      }
    }

    if (lessonIds.length === 0) {
      const sectionIds = await tryLoadSectionIds();
      if (sectionIds.length) {
        const lessonsBySectionRes = await supabase
          .from('lessons')
          .select('id')
          .in('section_id', sectionIds as any);
        if (!lessonsBySectionRes.error) {
          lessonIds = (lessonsBySectionRes.data || []).map((l: any) => String(l.id)).filter(Boolean);
        }
      }
    }

    const totalLessons = lessonIds.length;

    const progressMap = new Map<string, number>();
    unifiedEnrollments.forEach((e) => {
      progressMap.set(String(e.userId), Number(e.progress || 0));
    });

    const { data: usersRows, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, phone, parent_phone, mother_phone, student_phone')
      .in('id', realUserIds as any);

    if (usersError) {
      console.error('Error loading users in /api/admin/courses/[id]/students:', usersError);
      return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
    }

    const usersMap = new Map<string, any>((usersRows || []).map((u: any) => [String(u.id), u]));

    const achievementsCountMap = new Map<string, number>();

    {
      const richRes = await supabase
        .from('user_achievements')
        .select('user_id, course_id, achievements:achievement_id(course_id)')
        .in('user_id', realUserIds as any)
        .eq('is_completed', true);

      if (!richRes.error) {
        (richRes.data || []).forEach((row: any) => {
          const userId = String(row.user_id || '').trim();
          if (!userId) return;
          const isForCourse = row.course_id === courseId || row.achievements?.course_id === courseId;
          if (!isForCourse) return;
          achievementsCountMap.set(userId, (achievementsCountMap.get(userId) || 0) + 1);
        });
      } else {
        const fallbackRes = await supabase
          .from('user_achievements')
          .select('user_id')
          .in('user_id', realUserIds as any)
          .eq('is_completed', true);

        if (fallbackRes.error) {
          console.error('Error loading achievements in /api/admin/courses/[id]/students:', fallbackRes.error);
        }

        (fallbackRes.data || []).forEach((row: any) => {
          const userId = String(row.user_id || '').trim();
          if (!userId) return;
          achievementsCountMap.set(userId, (achievementsCountMap.get(userId) || 0) + 1);
        });
      }
    }

    const examsCountMap = new Map<string, number>();
    const examScoresMap = new Map<string, number[]>();

    let quizAttempts: any[] | null = null;
    let quizAttemptsError: any = null;

    {
      const res = await supabase
        .from('quiz_attempts')
        .select('user_id, score, percentage, quizzes:quiz_id(course_id)')
        .in('user_id', realUserIds as any);
      quizAttempts = res.data as any;
      quizAttemptsError = res.error as any;
    }

    if (!quizAttemptsError) {
      (quizAttempts || []).forEach((row: any) => {
        const userId = String(row.user_id || '').trim();
        if (!userId) return;

        if (row.quizzes?.course_id !== courseId) return;

        examsCountMap.set(userId, (examsCountMap.get(userId) || 0) + 1);

        const score = Number(row.percentage ?? row.score ?? 0);
        if (Number.isFinite(score) && score > 0) {
          const arr = examScoresMap.get(userId) || [];
          arr.push(score);
          examScoresMap.set(userId, arr);
        }
      });
    } else {
      let quizResultsRows: any[] = [];
      let quizResultsError: any = null;

      // Attempt 1: quiz_results has course_id + user_id
      {
        const res = await supabase
          .from('quiz_results')
          .select('user_id, score, total_questions, course_id')
          .in('user_id', realUserIds as any)
          .eq('course_id', courseId);
        if (!res.error) {
          quizResultsRows = (res.data as any[]) || [];
        } else {
          quizResultsError = res.error;
        }
      }

      // Attempt 2: quiz_results has quiz_id + user_id (join quizzes for course)
      if (quizResultsError) {
        const res = await supabase
          .from('quiz_results')
          .select('user_id, score, total_questions, quizzes:quiz_id(course_id)')
          .in('user_id', realUserIds as any);
        if (!res.error) {
          quizResultsRows = ((res.data as any[]) || []).filter((r: any) => r?.quizzes?.course_id === courseId);
          quizResultsError = null;
        }
      }

      // Attempt 3: quiz_results has student_id (legacy schema)
      if (quizResultsError) {
        const res = await supabase
          .from('quiz_results')
          .select('student_id, score, total_questions, course_id')
          .in('student_id', realUserIds as any)
          .eq('course_id', courseId);
        if (!res.error) {
          quizResultsRows = (res.data as any[]) || [];
          quizResultsError = null;
        }
      }

      // Attempt 4: quiz_results has student_id + quiz_id (join quizzes for course)
      if (quizResultsError) {
        const res = await supabase
          .from('quiz_results')
          .select('student_id, score, total_questions, quizzes:quiz_id(course_id)')
          .in('student_id', realUserIds as any);
        if (!res.error) {
          quizResultsRows = ((res.data as any[]) || []).filter((r: any) => r?.quizzes?.course_id === courseId);
          quizResultsError = null;
        }
      }

      if (quizResultsError) {
        console.error('Error loading quiz attempts/results in /api/admin/courses/[id]/students:', quizAttemptsError);
      }

      (quizResultsRows || []).forEach((row: any) => {
        const userId = String(row.user_id ?? row.student_id ?? '').trim();
        if (!userId) return;

        examsCountMap.set(userId, (examsCountMap.get(userId) || 0) + 1);

        const total = Number(row.total_questions ?? 0);
        const scoreRaw = Number(row.score ?? 0);
        const pct = total > 0 ? (scoreRaw / total) * 100 : scoreRaw;
        if (Number.isFinite(pct) && pct > 0) {
          const arr = examScoresMap.get(userId) || [];
          arr.push(pct);
          examScoresMap.set(userId, arr);
        }
      });
    }

    if (realUserIds.length > 0) {
      let lessonProgressRows: any[] | null = null;
      let lessonProgressError: any = null;

      {
        const res = await supabase
          .from('lesson_progress')
          .select('user_id, lesson_id, progress, is_completed, course_id')
          .in('user_id', realUserIds as any)
          .eq('course_id', courseId);
        lessonProgressRows = res.data as any;
        lessonProgressError = res.error as any;
      }

      if (lessonProgressError) {
        if (lessonIds.length) {
          const retry = await supabase
            .from('lesson_progress')
            .select('user_id, lesson_id, progress, is_completed')
            .in('user_id', realUserIds as any)
            .in('lesson_id', lessonIds as any);
          if (!retry.error) {
            lessonProgressRows = retry.data as any;
            lessonProgressError = null;
          }
        }
      }

      if (!lessonProgressError && Array.isArray(lessonProgressRows) && lessonProgressRows.length > 0) {
        const sumByUser = new Map<string, number>();
        const lessonsCountByUser = new Map<string, number>();
        const bestByUserLesson = new Map<string, number>();

        (lessonProgressRows || []).forEach((row: any) => {
          const userId = String(row.user_id || '').trim();
          const lessonId = String(row.lesson_id || '').trim();
          if (!userId || !lessonId) return;

          const pct = row.is_completed ? 100 : Number(row.progress ?? 0);
          const key = `${userId}:${lessonId}`;
          const prev = bestByUserLesson.get(key);
          if (prev === undefined || pct > prev) {
            bestByUserLesson.set(key, pct);
          }
        });

        bestByUserLesson.forEach((pct, key) => {
          const userId = key.split(':')[0];
          sumByUser.set(userId, (sumByUser.get(userId) || 0) + Number(pct || 0));
          lessonsCountByUser.set(userId, (lessonsCountByUser.get(userId) || 0) + 1);
        });

        realUserIds.forEach((uid) => {
          const userKey = String(uid);
          const lessonsForUser = lessonsCountByUser.get(userKey) || 0;
          if (lessonsForUser <= 0) return;

          const sum = sumByUser.get(userKey) || 0;
          const denom = totalLessons > 0 ? totalLessons : lessonsForUser;
          if (denom > 0) {
            const computed = Math.round(sum / denom);
            progressMap.set(userKey, computed);
          }
        });
      }
    }

    const students = unifiedEnrollments.map((enr) => {
      const u = usersMap.get(String(enr.userId));
      const scores = examScoresMap.get(String(enr.userId)) || [];
      const avg = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : undefined;

      return {
        id: (u && String(u.id)) || enr.userId,
        name: (u && u.name) || enr.fallbackName || 'غير معروف',
        email: u?.email || undefined,
        phone: u?.phone || u?.student_phone || enr.fallbackPhone || undefined,
        parent_phone: u?.parent_phone || u?.mother_phone || undefined,
        enrolled_at: enr.enrolledAt || '',
        progress: Number(progressMap.get(String(enr.userId)) ?? enr.progress ?? 0),
        achievements_count: achievementsCountMap.get(String(enr.userId)) || 0,
        exams_count: examsCountMap.get(String(enr.userId)) || 0,
        average_score: avg,
      };
    });

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Unexpected error in /api/admin/courses/[id]/students:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // التحقق من الصلاحيات
    const roleCookie = request.cookies.get('user-role')?.value;
    const cookieUserId = request.cookies.get('user-id')?.value;

    if (!roleCookie || !cookieUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (roleCookie !== 'admin' && roleCookie !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { studentId, courseId, parentPhone } = body;

    if (!studentId || !parentPhone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // جلب بيانات الطالب
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('id, name, email, phone, parent_phone, mother_phone')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 },
      );
    }

    // جلب بيانات الكورس
    const { data: course } = courseId
      ? await supabase
          .from('courses')
          .select('id, title')
          .eq('id', courseId)
          .maybeSingle()
      : ({ data: null } as any);

    // جلب كل كورسات الطالب من جدولين (الجديد والقديم)
    const enrollmentMap = new Map<
      string,
      {
        courseId: string;
        enrolledAt?: string | null;
        lastAccessed?: string | null;
        progress?: number;
      }
    >();

    {
      const res1 = await supabase
        .from('enrollments')
        .select('course_id, enrolled_at, last_accessed, progress')
        .eq('user_id', studentId)
        .eq('is_active', true);

      let rows: any[] = [];
      if (!res1.error) {
        rows = (res1.data as any[]) || [];
      } else {
        const retry = await supabase
          .from('enrollments')
          .select('course_id, enrolled_at, last_accessed, progress')
          .eq('user_id', studentId);
        rows = (retry.data as any[]) || [];
      }

      rows.forEach((r: any) => {
        const cId = String(r.course_id || '').trim();
        if (!cId) return;
        enrollmentMap.set(cId, {
          courseId: cId,
          enrolledAt: r.enrolled_at ?? null,
          lastAccessed: r.last_accessed ?? null,
          progress: Number(r.progress ?? 0),
        });
      });
    }

    {
      const res1 = await supabase
        .from('course_enrollments')
        .select('course_id, enrolled_at, last_accessed, progress_percentage')
        .eq('student_id', studentId)
        .eq('is_active', true);

      let rows: any[] = [];
      if (!res1.error) {
        rows = (res1.data as any[]) || [];
      } else {
        const retry = await supabase
          .from('course_enrollments')
          .select('course_id, enrolled_at, last_accessed, progress_percentage')
          .eq('student_id', studentId);
        rows = (retry.data as any[]) || [];
      }

      rows.forEach((r: any) => {
        const cId = String(r.course_id || '').trim();
        if (!cId) return;
        if (!enrollmentMap.has(cId)) {
          enrollmentMap.set(cId, {
            courseId: cId,
            enrolledAt: r.enrolled_at ?? null,
            lastAccessed: r.last_accessed ?? null,
            progress: Number(r.progress_percentage ?? 0),
          });
        }
      });
    }

    // fallback: approved payment_requests (لو مفيش صفوف تسجيل)
    if (enrollmentMap.size === 0) {
      const { data: paymentRequests } = await supabase
        .from('payment_requests')
        .select('course_id, approved_at, created_at, status')
        .eq('student_id', studentId)
        .eq('status', 'approved');

      (paymentRequests || []).forEach((p: any) => {
        const cId = String(p.course_id || '').trim();
        if (!cId) return;
        enrollmentMap.set(cId, {
          courseId: cId,
          enrolledAt: p.approved_at || p.created_at || null,
          lastAccessed: null,
          progress: 0,
        });
      });
    }

    let courseIds = Array.from(enrollmentMap.keys());

    if (roleCookie === 'teacher') {
      const { data: teacherCourses } = await supabase
        .from('courses')
        .select('id')
        .in('id', courseIds as any)
        .eq('instructor_id', cookieUserId);

      const allowed = new Set((teacherCourses || []).map((c: any) => String(c.id)));
      courseIds = courseIds.filter((id: string) => allowed.has(String(id)));
    }

    const effectiveCourse = course && courseIds.includes(String(course.id)) ? course : null;

    // تحميل بيانات الكورسات
    const { data: coursesRows } = courseIds.length
      ? await supabase
          .from('courses')
          .select('id, title')
          .in('id', courseIds as any)
      : ({ data: [] } as any);

    const courseTitleMap = new Map<string, string>(
      (coursesRows || []).map((c: any) => [String(c.id), String(c.title || '')]),
    );

    // تحميل الدروس (علشان حساب إجمالي الدروس + ربط lesson_id بالكورس)
    const { data: lessonsRows } = courseIds.length
      ? await supabase
          .from('lessons')
          .select('id, course_id')
          .in('course_id', courseIds as any)
      : ({ data: [] } as any);

    const lessonIdToCourseId = new Map<string, string>();
    const totalLessonsByCourse = new Map<string, number>();
    (lessonsRows || []).forEach((l: any) => {
      const lId = String(l.id || '').trim();
      const cId = String(l.course_id || '').trim();
      if (lId && cId) {
        lessonIdToCourseId.set(lId, cId);
        totalLessonsByCourse.set(cId, (totalLessonsByCourse.get(cId) || 0) + 1);
      }
    });

    let safeLessonProgressRows: any[] = [];

    if (courseIds.length) {
      // تحميل تقدم الدروس للطالب
      const { data: lessonProgressRows, error: lessonProgressError } = await supabase
        .from('lesson_progress')
        .select('course_id, lesson_id, progress, is_completed')
        .eq('user_id', studentId)
        .in('course_id', courseIds as any);

      if (!lessonProgressError) {
        safeLessonProgressRows = (lessonProgressRows as any[]) || [];
      } else {
        const lessonIds = Array.from(lessonIdToCourseId.keys());
        if (lessonIds.length) {
          const retry = await supabase
            .from('lesson_progress')
            .select('lesson_id, progress, is_completed')
            .eq('user_id', studentId)
            .in('lesson_id', lessonIds as any);
          safeLessonProgressRows = (retry.data as any[]) || [];
        }
      }
    }

    const bestLessonProgress = new Map<string, number>();
    safeLessonProgressRows.forEach((row: any) => {
      const lessonId = String(row.lesson_id || '').trim();
      if (!lessonId) return;
      const pct = row.is_completed ? 100 : Number(row.progress ?? 0);
      const prev = bestLessonProgress.get(lessonId);
      if (prev === undefined || pct > prev) {
        bestLessonProgress.set(lessonId, pct);
      }
    });

    const completedLessonsByCourse = new Map<string, number>();
    const sumProgressByCourse = new Map<string, number>();
    const touchedLessonsByCourse = new Map<string, number>();

    bestLessonProgress.forEach((pct, lessonId) => {
      const courseIdFromLesson = lessonIdToCourseId.get(lessonId);
      if (!courseIdFromLesson) return;
      sumProgressByCourse.set(courseIdFromLesson, (sumProgressByCourse.get(courseIdFromLesson) || 0) + Number(pct || 0));
      touchedLessonsByCourse.set(courseIdFromLesson, (touchedLessonsByCourse.get(courseIdFromLesson) || 0) + 1);
      if (pct >= 100) {
        completedLessonsByCourse.set(courseIdFromLesson, (completedLessonsByCourse.get(courseIdFromLesson) || 0) + 1);
      }
    });

    const computedProgressByCourse = new Map<string, number>();
    courseIds.forEach((cId) => {
      const total = totalLessonsByCourse.get(cId) || 0;
      const denom = total > 0 ? total : (touchedLessonsByCourse.get(cId) || 0);
      if (denom <= 0) return;
      const sum = sumProgressByCourse.get(cId) || 0;
      computedProgressByCourse.set(cId, Math.round(sum / denom));
    });

    // تحميل بيانات الامتحانات
    const examsByCourse = new Map<
      string,
      {
        count: number;
        scores: number[];
        latest: { title: string; score: number | null; passed?: boolean }[];
      }
    >();

    const pushExam = (courseIdForExam: string, title: string, scoreVal: number | null, passed?: boolean) => {
      const prev = examsByCourse.get(courseIdForExam) || { count: 0, scores: [], latest: [] };
      prev.count += 1;
      if (typeof scoreVal === 'number' && Number.isFinite(scoreVal) && scoreVal > 0) {
        prev.scores.push(scoreVal);
      }
      if (prev.latest.length < 3) {
        prev.latest.push({ title, score: scoreVal, passed });
      }
      examsByCourse.set(courseIdForExam, prev);
    };

    if (courseIds.length) {
      const { data: quizAttempts, error: quizAttemptsError } = await supabase
        .from('quiz_attempts')
        .select('score, percentage, passed, quizzes:quiz_id(title, course_id)')
        .eq('user_id', studentId)
        .order('completed_at', { ascending: false });

      if (!quizAttemptsError) {
        (quizAttempts || []).forEach((a: any) => {
          const cId = String(a?.quizzes?.course_id || '').trim();
          if (!cId) return;
          if (!courseIds.includes(cId)) return;
          const title = String(a?.quizzes?.title || 'اختبار');
          const score = Number(a?.percentage ?? a?.score ?? 0);
          pushExam(cId, title, Number.isFinite(score) ? score : null, a?.passed);
        });
      } else {
        // fallback to quiz_results
        let quizResultsRows: any[] = [];
        let ok = false;

        {
          const res = await supabase
            .from('quiz_results')
            .select('user_id, score, total_questions, course_id')
            .eq('user_id', studentId)
            .in('course_id', courseIds as any);
          if (!res.error) {
            quizResultsRows = (res.data as any[]) || [];
            ok = true;
          }
        }

        if (!ok) {
          const res = await supabase
            .from('quiz_results')
            .select('user_id, score, total_questions, quizzes:quiz_id(title, course_id)')
            .eq('user_id', studentId);
          if (!res.error) {
            quizResultsRows = ((res.data as any[]) || []).filter((r: any) => courseIds.includes(String(r?.quizzes?.course_id || '')));
            ok = true;
          }
        }

        if (!ok) {
          const res = await supabase
            .from('quiz_results')
            .select('student_id, score, total_questions, course_id')
            .eq('student_id', studentId)
            .in('course_id', courseIds as any);
          if (!res.error) {
            quizResultsRows = (res.data as any[]) || [];
            ok = true;
          }
        }

        if (!ok) {
          const res = await supabase
            .from('quiz_results')
            .select('student_id, score, total_questions, quizzes:quiz_id(title, course_id)')
            .eq('student_id', studentId);
          if (!res.error) {
            quizResultsRows = ((res.data as any[]) || []).filter((r: any) => courseIds.includes(String(r?.quizzes?.course_id || '')));
            ok = true;
          }
        }

        (quizResultsRows || []).forEach((r: any) => {
          const cId = String(r?.course_id || r?.quizzes?.course_id || '').trim();
          if (!cId) return;
          if (!courseIds.includes(cId)) return;

          const title = String(r?.quizzes?.title || 'اختبار');
          const total = Number(r?.total_questions ?? 0);
          const raw = Number(r?.score ?? 0);
          const pct = total > 0 ? (raw / total) * 100 : raw;
          const score = Number.isFinite(pct) ? pct : null;
          pushExam(cId, title, score);
        });
      }
    }

    // جلب الإنجازات (من user_achievements مع achievements)
    const { data: allAchievements } = await supabase
      .from('user_achievements')
      .select('earned_at, achievements:achievement_id(title, description, icon, course_id), course_id')
      .eq('user_id', studentId)
      .eq('is_completed', true)
      .order('earned_at', { ascending: false });

    const achievementsRows = ((allAchievements || []) as any[]);
    const achievementsTotal = achievementsRows.length;
    const achievements = achievementsRows.slice(0, 50).map((ach: any) => ({
      title: ach.achievements?.title || ach.title,
      description: ach.achievements?.description || ach.description,
      earnedAt: ach.earned_at,
      courseId: ach.course_id || ach.achievements?.course_id || null,
    }));

    // تجهيز بيانات كل كورس
    const coursesReport = courseIds
      .map((cId) => {
        const base = enrollmentMap.get(cId);
        const computed = computedProgressByCourse.get(cId);
        const progress = computed !== undefined ? computed : Number(base?.progress ?? 0);
        const totalLessons = totalLessonsByCourse.get(cId) || 0;
        const completedLessons = completedLessonsByCourse.get(cId) || 0;
        const examAgg = examsByCourse.get(cId);
        const avg = examAgg && examAgg.scores.length
          ? Math.round(examAgg.scores.reduce((a, b) => a + b, 0) / examAgg.scores.length)
          : null;

        return {
          id: cId,
          title: courseTitleMap.get(cId) || 'كورس',
          progress,
          totalLessons,
          completedLessons,
          enrolledAt: base?.enrolledAt ?? null,
          lastAccessed: base?.lastAccessed ?? null,
          examsCount: examAgg?.count || 0,
          averageScore: avg,
          latestExams: examAgg?.latest || [],
        };
      })
      .sort((a, b) => String(a.title).localeCompare(String(b.title), 'ar'));

    // بناء التقرير
    const report = {
      student: {
        name: student.name,
        phone: student.phone,
      },
      course: effectiveCourse ? { title: effectiveCourse.title } : null,
      courses: coursesReport,
      achievements,
      achievementsTotal,
      generatedForCourseId: courseId || null,
    };

    // بناء رسالة التقرير
    const buildCoursesList = (includeLatestExams: boolean) => {
      return report.courses.length
        ? report.courses
            .map((c: any) => {
              const lessonsPart = c.totalLessons > 0
                ? ` (${c.completedLessons}/${c.totalLessons} دروس)`
                : '';

              const examsPart = c.examsCount > 0
                ? ` | امتحانات: ${c.examsCount}${c.averageScore !== null ? ` | متوسط: ${c.averageScore}%` : ''}`
                : ' | لا يوجد امتحانات';

              const latestExams = includeLatestExams && c.latestExams && c.latestExams.length
                ? `\n${c.latestExams
                    .map((e: any) => `  - ${e.title}: ${e.score !== null ? `${Math.round(Number(e.score))}%` : '-'}${e.passed === true ? ' ✅' : e.passed === false ? ' ❌' : ''}`)
                    .join('\n')}`
                : '';

              return `• ${c.title}: ${c.progress}%${lessonsPart}${examsPart}${latestExams}`;
            })
            .join('\n')
        : 'لا يوجد كورسات مسجل بها الطالب حالياً';
    };

    const buildAchievementsList = (maxCount: number) => {
      const slice = report.achievements.slice(0, Math.max(0, maxCount));
      return slice.length > 0
        ? slice.map((a: any) => `• ${a.title}`).join('\n')
        : 'لا توجد إنجازات بعد';
    };

    const headerCourseTitle = report.course?.title ? `\n\n📚 *الكورس الحالي:* ${report.course.title}` : '';

    const buildMessage = (includeLatestExams: boolean, achievementsShown: number, compactNote?: string) => {
      const coursesList = buildCoursesList(includeLatestExams);
      const achievementsList = buildAchievementsList(achievementsShown);
      const achievementsSuffix = report.achievementsTotal > achievementsShown
        ? ` (عرض أول ${achievementsShown})`
        : '';

      const note = compactNote ? `\n\n${compactNote}` : '';

      return `*📊 تقرير الطالب: ${student.name}*${headerCourseTitle}

📚 *الكورسات المسجل بها الطالب:* ${report.courses.length}
${coursesList}

🏆 *الإنجازات:* ${report.achievementsTotal}${achievementsSuffix}
${achievementsList}${note}

---
*تم إنشاء التقرير تلقائياً من أكاديمية المستقبل (almostaqbal)*`.trim();
    };

    const MAX_WHATSAPP_TEXT_LENGTH = 3500;
    let message = buildMessage(true, Math.min(report.achievements.length, 50));

    if (message.length > MAX_WHATSAPP_TEXT_LENGTH) {
      message = buildMessage(false, Math.min(report.achievements.length, 20), 'ملاحظة: تم اختصار تفاصيل التقرير بسبب طول الرسالة.');
    }

    if (message.length > MAX_WHATSAPP_TEXT_LENGTH) {
      message = buildMessage(false, Math.min(report.achievements.length, 10), 'ملاحظة: تم اختصار تفاصيل التقرير بسبب طول الرسالة.');
    }

    // إرسال التقرير عبر WhatsApp
    // تنظيف رقم الهاتف (إزالة + ومسافات)
    const cleanPhone = String(parentPhone || '').replace(/\D/g, '');
    const normalized = cleanPhone.startsWith('00') ? cleanPhone.slice(2) : cleanPhone;
    const whatsappNumber = normalized.startsWith('20')
      ? normalized
      : normalized.startsWith('0')
      ? `20${normalized.slice(1)}`
      : `20${normalized}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء التقرير بنجاح',
      whatsappUrl,
      report: {
        ...report,
        parentPhone,
        message,
      },
    });
  } catch (e: any) {
    console.error('Error generating parent report:', e);
    return NextResponse.json(
      { error: e?.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}


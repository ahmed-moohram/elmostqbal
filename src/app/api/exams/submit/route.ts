import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getExam } from '../_store';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase configuration for exams submit API. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { examId, answers, courseId, userId, cheated } = body || {};

    if (!examId || !courseId || !userId) {
      return NextResponse.json({ error: 'missing_required_fields' }, { status: 400 });
    }

    // تأكيد أن الطالب مشترك في هذا الكورس قبل السماح له بدخول/تقديم الامتحان
    let isEnrolled = false;
    try {
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('id, is_active')
        .eq('student_id', userId)
        .eq('course_id', courseId)
        .maybeSingle();

      if (enrollmentError) {
        console.error('Error checking course_enrollments in /api/exams/submit:', enrollmentError);
        return NextResponse.json(
          { error: 'enrollment_check_failed' },
          { status: 500 }
        );
      }

      if (enrollment && enrollment.is_active !== false) {
        isEnrolled = true;
      } else {
        const { data: legacyEnrollment, error: legacyError } = await supabase
          .from('enrollments')
          .select('id, is_active')
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .maybeSingle();

        if (legacyError) {
          console.warn('Error checking legacy enrollments in /api/exams/submit:', legacyError);
        }

        if (legacyEnrollment && legacyEnrollment.is_active !== false) {
          isEnrolled = true;
        }
      }
    } catch (enrollmentException) {
      console.error('Unexpected error while checking enrollment in /api/exams/submit:', enrollmentException);
      return NextResponse.json(
        { error: 'enrollment_check_failed' },
        { status: 500 }
      );
    }

    if (!isEnrolled) {
      return NextResponse.json(
        {
          success: false,
          error: 'not_enrolled',
          message: 'ليس لديك صلاحية لدخول هذا الامتحان. يجب الاشتراك في الكورس أولاً.',
        },
        { status: 403 }
      );
    }

    // أولاً نحاول تحميل الامتحان من جدول exams في Supabase
    let exam: any | null = null;
    try {
      const { data: examRow, error: examError } = await supabase
        .from('exams')
        .select(
          'id, course_id, title, duration, total_marks, passing_marks, questions',
        )
        .eq('id', examId)
        .maybeSingle();

      if (!examError && examRow) {
        exam = {
          id: String(examRow.id),
          courseId: String(examRow.course_id),
          title: examRow.title || '',
          duration: Number(examRow.duration || 0),
          totalMarks: Number(examRow.total_marks || 0),
          passingMarks: Number(examRow.passing_marks || 0),
          questions: Array.isArray(examRow.questions) ? examRow.questions : [],
        };
      }
    } catch (err) {
      console.error('Error loading exam from Supabase in /api/exams/submit:', err);
    }

    // في حال لم يُعثَر على الامتحان في قاعدة البيانات نعود للمخزن التجريبي (للامتحانات القديمة)
    if (!exam) {
      const legacy = getExam(String(examId));
      if (!legacy) {
        return NextResponse.json({ error: 'exam_not_found' }, { status: 404 });
      }
      exam = legacy;
    }

    // قبل احتساب الدرجة، نتحقق من وجود محاولات سابقة لهذا الطالب في هذا الامتحان
    const CHEAT_LIMIT = 1;

    try {
      const { data: existingAttempts, error: attemptsError } = await supabase
        .from('quiz_results')
        .select('id, answers')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('quiz_id', exam.id);

      if (attemptsError) {
        console.error('Error checking existing quiz_results in /api/exams/submit:', attemptsError);
      } else if (Array.isArray(existingAttempts) && existingAttempts.length > 0) {
        let cheatAttempts = 0;
        let nonCheatAttempts = 0;

        for (const row of existingAttempts as any[]) {
          let isRowCheated = false;
          try {
            if (row.answers && typeof row.answers === 'object') {
              if ((row.answers as any).__cheated) {
                isRowCheated = true;
              }
            }
          } catch {
            isRowCheated = false;
          }

          if (isRowCheated) {
            cheatAttempts += 1;
          } else {
            nonCheatAttempts += 1;
          }
        }

        // إذا كان هناك أي محاولة بدون غش، يمنع إعادة الامتحان إلا إذا المدرس مسح النتائج
        if (nonCheatAttempts > 0) {
          return NextResponse.json(
            { success: false, error: 'already_attempted', message: 'لقد تم حل هذا الامتحان مسبقاً ولا يمكن إعادته إلا بعد سماح المدرس.' },
            { status: 400 },
          );
        }

        // إذا تجاوز عدد محاولات الغش الحد، نغلق الامتحان نهائياً لهذا الطالب
        if (cheatAttempts >= CHEAT_LIMIT) {
          return NextResponse.json(
            { success: false, error: 'cheat_limit_reached', message: 'تم إيقاف هذا الامتحان بسبب تكرار محاولات الغش.' },
            { status: 400 },
          );
        }
      }
    } catch (checkErr) {
      console.error('Unexpected error while checking previous attempts in /api/exams/submit:', checkErr);
      // في حال فشل التحقق نسمح بالمحاولة بدلاً من منع الطالب بلا سبب واضح
    }

    let scoreMarks = 0;
    let totalMarks = 0;

    for (const q of exam.questions) {
      const marks = q.marks || 0;
      totalMarks += marks;
      const ans = answers ? answers[q.id] : undefined;
      if (ans && ans === (q as any).correctAnswer) scoreMarks += marks;
    }

    const isCheated = !!cheated;

    if (isCheated) {
      scoreMarks = 0;
    }

    // نتأكد أن درجة النجاح منطقية (لا تتجاوز مجموع الدرجات ولا تكون سالبة)
    const rawPassingMarks = typeof exam.passingMarks === 'number'
      ? exam.passingMarks
      : Number(exam.passingMarks || 0) || 0;
    const normalizedPassingMarks = Math.min(
      Math.max(rawPassingMarks, 0),
      totalMarks || 0,
    );

    const passed = !isCheated && scoreMarks >= normalizedPassingMarks;
    const totalQuestions = Array.isArray(exam.questions) ? exam.questions.length : 0;
    const scorePercent = totalMarks > 0 ? Math.round((scoreMarks / totalMarks) * 100) : 0;

    let storedAnswers: any = answers || null;
    try {
      if (storedAnswers && typeof storedAnswers === 'object' && !Array.isArray(storedAnswers)) {
        storedAnswers = { ...storedAnswers, __cheated: isCheated };
      } else if (storedAnswers !== null) {
        storedAnswers = { value: storedAnswers, __cheated: isCheated };
      } else {
        storedAnswers = { __cheated: isCheated };
      }
    } catch {
      storedAnswers = { __cheated: isCheated };
    }

    try {
      await supabase.from('quiz_results').insert({
        user_id: userId,
        course_id: courseId,
        quiz_id: exam.id,
        quiz_title: exam.title,
        score: scorePercent,
        total_questions: totalQuestions,
        passed,
        time_taken: null,
        answers: storedAnswers,
      });
    } catch (err) {
      console.error('Error inserting quiz_results for exam submit:', err);
      // لا نمنع الطالب من الحصول على النتيجة حتى لو فشل الحفظ
    }

    return NextResponse.json({
      success: true,
      courseId,
      examId,
      score: scorePercent,
      totalMarks,
      passed,
    });
  } catch (err) {
    console.error('Unexpected error in /api/exams/submit:', err);
    return NextResponse.json({ error: 'submit_failed' }, { status: 500 });
  }
}
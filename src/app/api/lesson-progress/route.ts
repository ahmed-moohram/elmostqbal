import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const lessonId = searchParams.get('lessonId');
    const courseId = searchParams.get('courseId');

    if (!userId || !lessonId) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم ومعرف الدرس مطلوبان' },
        { status: 400 }
      );
    }

    const makeBaseQuery = () =>
      supabase
        .from('lesson_progress')
        .select('id, progress, is_completed, total_duration, course_id, completed_at')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId);

    let data: any = null;
    let error: any = null;
    if (courseId) {
      const res1 = await makeBaseQuery().eq('course_id', courseId).maybeSingle();
      data = res1.data;
      error = res1.error;
    } else {
      const res1 = await makeBaseQuery().maybeSingle();
      data = res1.data;
      error = res1.error;
    }

    if (!data && courseId && (!error || error.code === 'PGRST116')) {
      const res2 = await makeBaseQuery().maybeSingle();
      data = res2.data;
      error = res2.error;
    }

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json(
        { success: false, error: `فشل جلب التقدم: ${error.message}` },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ success: true, progress: null });
    }

    const progressPercent = typeof data.progress === 'number' ? data.progress : 0;
    const totalDurationSeconds = typeof data.total_duration === 'number' ? data.total_duration : 0;
    const watchedSeconds = totalDurationSeconds > 0
      ? (data.is_completed ? totalDurationSeconds : Math.floor((progressPercent / 100) * totalDurationSeconds))
      : 0;

    return NextResponse.json({
      success: true,
      progress: {
        id: data.id,
        courseId: data.course_id,
        progressPercent,
        isCompleted: !!data.is_completed,
        totalDurationSeconds,
        watchedSeconds,
        completedAt: data.completed_at,
      },
    });
  } catch (error: any) {
    console.error('Error in lesson-progress GET API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ في جلب التقدم' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lessonId, courseId, watchedSeconds, progressPercent, duration, isCompleted } = body;

    if (!lessonId || !courseId) {
      return NextResponse.json(
        { success: false, error: 'معرف الدرس والكورس مطلوبان' },
        { status: 400 }
      );
    }

    // الحصول على معرف المستخدم من body (يُرسل من العميل)
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم مطلوب' },
        { status: 401 }
      );
    }

    // ملاحظة: لا نستخدم enrollment_id لأن الجدول قد لا يحتوي على هذا العمود

    // حفظ التقدم في جدول lesson_progress
    // نتعامل مع user_id و course_id حتى يمكن تجميع التقدم لكل كورس في لوحة التحكم
    let existingProgressData: any = null;
    let fetchError: any = null;
    
    // محاولة 1: البحث عن صف موجود بنفس user_id و lesson_id
    const { data: progress1, error: error1 } = await supabase
      .from('lesson_progress')
      .select('id, progress, is_completed, completed_at, total_duration, course_id')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();
    
    if (progress1) {
      existingProgressData = progress1 as any;
    } else if (error1 && error1.code !== 'PGRST116') {
      fetchError = error1 as any;
    }

    // ملاحظة: لا نستخدم student_id لأن الجدول قد لا يحتوي على هذا العمود

    // حساب progressPercent إذا لم يكن محدداً
    const calculatedProgressPercent = progressPercent !== undefined && progressPercent !== null
      ? Math.min(Math.max(progressPercent, 0), 100)
      : (watchedSeconds && duration > 0
          ? Math.min(Math.round((watchedSeconds / duration) * 100), 100)
          : 0);
    
    const finalIsCompleted = isCompleted !== undefined ? isCompleted : (calculatedProgressPercent >= 100);

    if (existingProgressData) {
      // تحديث التقدم الموجود
      // نستخدم الأعمدة الأساسية: progress, is_completed, total_duration, course_id
      const updateData: any = {
        progress: calculatedProgressPercent,
        is_completed: finalIsCompleted,
        // duration يتم إرساله من العميل بالثواني بالفعل
        total_duration: duration && duration > 0 ? duration : (existingProgressData.total_duration || 0),
      };

      // التأكد من تخزين course_id حتى يمكن تجميع التقدم لكل كورس
      if (courseId) {
        updateData.course_id = courseId;
      }

      if (finalIsCompleted && !existingProgressData.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('lesson_progress')
        .update(updateData)
        .eq('id', existingProgressData.id);

      if (updateError) {
        console.error('Error updating lesson progress:', updateError);
        return NextResponse.json(
          { success: false, error: `فشل تحديث التقدم: ${updateError.message}` },
          { status: 500 }
        );
      }
    } else {
      // إنشاء تقدم جديد - نستخدم الأعمدة الأساسية بما في ذلك course_id
      const insertData: any = {
        user_id: userId,
        lesson_id: lessonId,
        progress: calculatedProgressPercent,
        is_completed: finalIsCompleted,
        // تخزين المدة بالثواني كما أرسلت من العميل
        total_duration: duration && duration > 0 ? duration : 0,
      };

      if (courseId) {
        insertData.course_id = courseId;
      }

      if (finalIsCompleted) {
        insertData.completed_at = new Date().toISOString();
      }

      const { error: insertError } = await supabase
        .from('lesson_progress')
        .insert(insertData);

      if (insertError) {
        console.error('Error inserting lesson progress:', insertError);
        return NextResponse.json(
          { success: false, error: `فشل حفظ التقدم: ${insertError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'تم حفظ التقدم بنجاح',
      progress: {
        watchedSeconds,
        progressPercent,
        isCompleted,
      },
    });
  } catch (error: any) {
    console.error('Error in lesson-progress API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ في حفظ التقدم' },
      { status: 500 }
    );
  }
}


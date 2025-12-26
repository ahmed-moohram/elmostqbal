import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('❌ Missing Supabase configuration! Check your .env.local file');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lessonId, courseId, watchedSeconds, progressPercent, duration } = body;

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

    // حفظ التقدم في جدول lesson_progress
    const { data: existingProgress, error: fetchError } = await supabase
      .from('lesson_progress')
      .select('id, watched_seconds, progress_percent')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (هذا طبيعي)
      console.error('Error fetching lesson progress:', fetchError);
    }

    const isCompleted = progressPercent >= 80; // 80% يعتبر مكتملاً

    if (existingProgress) {
      // تحديث التقدم الموجود
      const { error: updateError } = await supabase
        .from('lesson_progress')
        .update({
          watched_seconds: watchedSeconds,
          progress_percent: progressPercent,
          is_completed: isCompleted,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProgress.id);

      if (updateError) {
        console.error('Error updating lesson progress:', updateError);
        return NextResponse.json(
          { success: false, error: 'فشل تحديث التقدم' },
          { status: 500 }
        );
      }
    } else {
      // إنشاء تقدم جديد
      const { error: insertError } = await supabase
        .from('lesson_progress')
        .insert({
          user_id: userId,
          lesson_id: lessonId,
          course_id: courseId,
          watched_seconds: watchedSeconds,
          progress_percent: progressPercent,
          is_completed: isCompleted,
          duration: duration || 0,
        });

      if (insertError) {
        console.error('Error inserting lesson progress:', insertError);
        return NextResponse.json(
          { success: false, error: 'فشل حفظ التقدم' },
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


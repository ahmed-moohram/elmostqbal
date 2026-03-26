import { NextRequest, NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, lessonId, courseId, points = 10, action = 'lesson_completed', description } = body;

    if (!userId || !lessonId) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم والدرس مطلوبان' },
        { status: 400 }
      );
    }

    // إضافة سجل النقاط في points_history
    const { error: historyError } = await supabase
      .from('points_history')
      .insert({
        user_id: userId,
        points: points,
        action: action,
        description: description || `إكمال درس في الكورس`,
        reference_id: lessonId,
      });

    if (historyError) {
      console.error('Error adding points history:', historyError);
      // لا نعيد الخطأ هنا لأننا قد نتمكن من تحديث النقاط الإجمالية
    }

    // تحديث أو إنشاء نقاط المستخدم في user_points
    const { data: existingPoints, error: fetchError } = await supabase
      .from('user_points')
      .select('total_points, lessons_completed')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user points:', fetchError);
    }

    const newTotalPoints = (existingPoints?.total_points || 0) + points;
    const newLessonsCompleted = (existingPoints?.lessons_completed || 0) + 1;

    const { error: upsertError } = await supabase
      .from('user_points')
      .upsert(
        {
          user_id: userId,
          total_points: newTotalPoints,
          lessons_completed: newLessonsCompleted,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (upsertError) {
      console.error('Error updating user points:', upsertError);
      return NextResponse.json(
        { success: false, error: 'فشل تحديث النقاط' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `تم منح ${points} نقطة بنجاح`,
      points: {
        total: newTotalPoints,
        earned: points,
        lessonsCompleted: newLessonsCompleted,
      },
    });
  } catch (error: any) {
    console.error('Error in points award API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ في منح النقاط' },
      { status: 500 }
    );
  }
}


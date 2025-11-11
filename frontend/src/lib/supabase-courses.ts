// دوال مساعدة للتعامل مع الكورسات في Supabase
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wnqifmvgvlmxgswhcwnc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWlmbXZndmxteGdzd2hjd25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MzYwNTUsImV4cCI6MjA3ODAxMjA1NX0.LqWhTZYmr7nu-dIy2uBBqntOxoWM-waluYIR9bipC9M';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// إنشاء كورس جديد مع الدروس
export const createCourseWithLessons = async (courseData: any, sections: any[]) => {
  try {
    console.log('📝 بيانات الكورس المرسلة:', courseData);
    
    // تحضير البيانات الأساسية فقط
    const courseToInsert: any = {
      title: courseData.title,
      description: courseData.description || '',
      instructor_name: courseData.instructor_name || 'مدرس المنصة',
      price: Number(courseData.price) || 0,
      duration_hours: Number(courseData.duration_hours) || 1,
      level: courseData.level || 'beginner',
      category: courseData.category || 'general',
      thumbnail: courseData.thumbnail || '/placeholder-course.png',
      is_published: courseData.is_published !== undefined ? courseData.is_published : false,
      is_featured: courseData.is_featured !== undefined ? courseData.is_featured : false
    };

    // إضافة الحقول الاختيارية إذا كان الجدول يدعمها
    const optionalFields = ['preview_video', 'discount_price', 'enrollment_count', 'rating', 'language', 'requirements', 'what_will_learn', 'has_certificate'];
    
    for (const field of optionalFields) {
      if (courseData[field] !== undefined) {
        courseToInsert[field] = courseData[field];
      }
    }

    console.log('📤 إرسال البيانات إلى Supabase:', courseToInsert);

    // 1. إنشاء الكورس
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert(courseToInsert)
      .select()
      .single();

    if (courseError) {
      console.error('❌ خطأ Supabase:', courseError);
      throw courseError;
    }

    // 2. إضافة الدروس إذا كانت موجودة
    if (course && sections && sections.length > 0) {
      let lessonOrder = 0;
      
      for (const section of sections) {
        if (section.title && section.lessons && section.lessons.length > 0) {
          for (const lesson of section.lessons) {
            if (lesson.title) {
              lessonOrder++;
              
              const { error: lessonError } = await supabase
                .from('lessons')
                .insert({
                  course_id: course.id,
                  title: lesson.title,
                  description: lesson.description || '',
                  video_url: lesson.videoUrl || lesson.video_url || '',
                  duration_minutes: lesson.duration || 0,
                  order_index: lessonOrder,
                  is_free: lessonOrder === 1, // أول درس مجاني
                  is_published: true
                });

              if (lessonError) {
                console.error('خطأ في إضافة درس:', lessonError);
              }
            }
          }
        }
      }
    }

    return { success: true, data: course };
  } catch (error) {
    console.error('خطأ في إنشاء الكورس:', error);
    return { success: false, error };
  }
};

// جلب كل الكورسات للأدمن
export const getAdminCourses = async () => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // تحويل البيانات للتنسيق المطلوب
    const transformedCourses = (data || []).map(course => ({
      _id: course.id,
      title: course.title,
      description: course.description,
      price: course.price,
      instructor: course.instructor_name,
      thumbnail: course.thumbnail,
      isPublished: course.is_published,
      enrolledStudents: course.enrollment_count || 0,
      rating: course.rating || 0,
      level: course.level,
      category: course.category,
      createdAt: course.created_at
    }));

    return { success: true, data: transformedCourses };
  } catch (error) {
    console.error('خطأ في جلب الكورسات:', error);
    return { success: false, error };
  }
};

// حذف كورس
export const deleteCourse = async (courseId: string) => {
  try {
    // حذف الدروس المرتبطة أولاً
    await supabase
      .from('lessons')
      .delete()
      .eq('course_id', courseId);

    // حذف الكورس
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('خطأ في حذف الكورس:', error);
    return { success: false, error };
  }
};

// تحديث كورس
export const updateCourse = async (courseId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .update({
        title: updates.title,
        description: updates.description,
        price: updates.price,
        level: updates.level,
        category: updates.category,
        is_published: updates.isPublished,
        thumbnail: updates.thumbnail,
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('خطأ في تحديث الكورس:', error);
    return { success: false, error };
  }
};

// نشر/إلغاء نشر كورس
export const togglePublishCourse = async (courseId: string, isPublished: boolean) => {
  try {
    const { error } = await supabase
      .from('courses')
      .update({ is_published: isPublished })
      .eq('id', courseId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('خطأ في تغيير حالة النشر:', error);
    return { success: false, error };
  }
};

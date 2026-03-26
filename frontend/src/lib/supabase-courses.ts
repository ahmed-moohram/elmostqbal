// دوال مساعدة للتعامل مع الكورسات في Supabase (مشروع chikf)
import supabase from '@/lib/supabase-client';

// إنشاء كورس جديد مع الدروس
export const createCourseWithLessons = async (courseData: any, sections: any[]) => {
  try {
    console.log('📝 بيانات الكورس المرسلة:', courseData);
    
    const title = courseData.title || 'دورة بدون عنوان';

    // توليد slug فريد مبني على العنوان
    let baseSlug = (courseData.slug || title)
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-ء-ي]+/g, '');

    if (!baseSlug) {
      baseSlug = `course-${Date.now()}`;
    }

    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`;

    // تحديد المدرّس المرتبط بالكورس
    let instructorId = courseData.instructor_id;

    if (!instructorId) {
      const defaultInstructorId = process.env.NEXT_PUBLIC_DEFAULT_INSTRUCTOR_ID;

      if (defaultInstructorId) {
        instructorId = defaultInstructorId;
      } else {
        const { data: teacher, error: teacherError } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'teacher')
          .limit(1)
          .single();

        if (teacherError || !teacher) {
          console.error('لا يمكن العثور على مدرس افتراضي لإنشاء الكورس:', teacherError);
          throw new Error('لا يمكن إنشاء الكورس: لم يتم العثور على مدرس افتراضي (instructor_id) في قاعدة البيانات.');
        }

        instructorId = teacher.id;
      }
    }

    const shortDescription =
      courseData.short_description ||
      courseData.shortDescription ||
      (courseData.description || '').slice(0, 200);

    const status =
      courseData.status || (courseData.is_published ? 'published' : 'draft');

    // تحضير البيانات الأساسية بما يتوافق مع بنية جدول الكورسات الحالية
    const courseToInsert: any = {
      title,
      slug,
      description: courseData.description || '',
      short_description: shortDescription,
      instructor_id: instructorId,
      category: courseData.category || 'عام',
      sub_category: courseData.sub_category || null,
      level: courseData.level || 'all-levels',
      language: courseData.language || 'ar',
      price: Number(courseData.price) || 0,
      discount_price: courseData.discount_price ?? null,
      thumbnail: courseData.thumbnail || '/placeholder-course.png',
      preview_video: courseData.preview_video || null,
      status,
      is_featured: courseData.is_featured !== undefined ? courseData.is_featured : false
    };

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

    // 2. إضافة الأقسام والدروس إذا كانت موجودة
    if (course && sections && sections.length > 0) {
      for (let sIndex = 0; sIndex < sections.length; sIndex++) {
        const section = sections[sIndex];
        if (!section || !section.title || !section.lessons || section.lessons.length === 0) {
          continue;
        }
        const response = await fetch('/api/sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: course.id,
            title: section.title,
            description: section.description || '',
            orderIndex: section.order ?? sIndex + 1,
            lessons: section.lessons.map((lesson: any, idx: number) => ({
              title: lesson.title,
              description: lesson.description || '',
              video_url: lesson.videoUrl || lesson.video_url || '',
              duration: Math.max(1, Number(lesson.duration) || 0),
              duration_minutes: Math.max(1, Number(lesson.duration) || 0),
              order_index: lesson.order ?? idx + 1,
              is_preview: !!lesson.isPreview || (sIndex === 0 && idx === 0),
            }))
          })
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          console.error('خطأ في إضافة قسم عبر API:', err);
          continue;
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
      .select('*, instructor_user:users!courses_instructor_id_fkey(id, name, avatar_url, profile_picture)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // تحويل البيانات للتنسيق المطلوب
    const transformedCourses = (data || []).map(course => ({
      _id: course.id,
      title: course.title,
      description: course.description,
      price: course.price,
      instructor: course?.instructor_user?.name || 'غير محدد',
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
    const { data: sections } = await supabase
      .from('sections')
      .select('id')
      .eq('course_id', courseId);
    const ids = (sections || []).map((s: any) => s.id);
    if (ids.length > 0) {
      await supabase
        .from('lessons')
        .delete()
        .in('section_id', ids);
      await supabase
        .from('sections')
        .delete()
        .in('id', ids);
    }
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
        status: updates.isPublished === true ? 'published' : updates.isPublished === false ? 'draft' : undefined,
        is_active: updates.isPublished === true ? true : updates.isPublished === false ? false : undefined,
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
      .update({ 
        is_published: isPublished,
        status: isPublished ? 'published' : 'draft',
        is_active: isPublished ? true : false,
      })
      .eq('id', courseId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('خطأ في تغيير حالة النشر:', error);
    return { success: false, error };
  }
};

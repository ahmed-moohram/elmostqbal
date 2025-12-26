// ========================================
// خدمة Supabase الموحدة للمنصة
// Unified Supabase Service
// ========================================

// إعادة استخدام عميل Supabase الموحد من lib
import supabase from '@/lib/supabase-client';

// التصدير للاستخدام في أماكن أخرى إن لزم
export { supabase };

// ========================================
// دوال الكورسات
// ========================================

export const getCourses = async (isPublished?: boolean) => {
  try {
    let query = supabase
      .from('courses')
      .select('*, instructor_user:users!courses_instructor_id_fkey(id, name, avatar_url, profile_picture)');

    // إذا طلبنا فقط الكورسات المنشورة، نستخدم حقل status ليتماشى مع RLS
    // RLS تسمح بالعرض عندما يكون status = 'published' و is_active = TRUE
    if (isPublished !== undefined) {
      if (isPublished) {
        query = query
          .eq('is_published', true)
          .eq('is_active', true);
      } else {
        query = query.eq('is_published', false);
      }
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // تحويل البيانات للشكل المطلوب
    const transformedCourses = (data || []).map(course => {
      const instructorName = course?.instructor_user?.name || 'غير محدد';
      const instructorImage =
        course?.instructor_user?.avatar_url ||
        course?.instructor_user?.profile_picture ||
        null;

      return {
      id: course.id,
      _id: course.id, // للتوافق مع الكود القديم
      title: course.title || 'بدون عنوان',
      description: course.description || '',
      instructor: course?.instructor_user?.name || 'غير محدد',
      instructor_name: instructorName,
      instructor_image: instructorImage,
      instructorId: course.instructor_id,
      price: course.price || 0,
      discountPrice: course.discount_price,
      thumbnail: course.thumbnail || '/placeholder-course.jpg',
      previewVideo: course.preview_video,
      category: course.category || 'عام',
      level: course.level || 'مبتدئ',
      duration: course.duration_hours || 0,
      isPublished: course.is_published || false,
      isFeatured: course.is_featured || false,
      rating: course.rating || 0,
      studentsCount: course.students_count || 0,
      createdAt: course.created_at
      };
    });
    
    return { success: true, data: transformedCourses };
  } catch (error) {
    console.error('Error fetching courses:', error);
    return { success: false, error };
  }
};

export const getCourseById = async (courseId: string) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        instructor_user:users!courses_instructor_id_fkey(id, name, avatar_url, profile_picture),
        lessons(*)
      `)
      .eq('id', courseId)
      .single();
    
    if (error) throw error;
    
    // تحويل البيانات
    const instructorName = data?.instructor_user?.name || 'غير محدد';
    const instructorImage =
      data?.instructor_user?.avatar_url ||
      data?.instructor_user?.profile_picture ||
      null;

    const transformedCourse = {
      id: data.id,
      _id: data.id,
      title: data.title,
      description: data.description,
      instructor: instructorName,
      instructor_name: instructorName,
      instructor_image: instructorImage,
      instructorId: data.instructor_id,
      price: data.price,
      thumbnail: data.thumbnail,
      category: data.category,
      level: data.level,
      duration: data.duration_hours,
      isPublished: data.is_published,
      rating: data.rating,
      studentsCount: data.students_count,
      lessons: data.lessons || [],
      sections: [] // سيتم تنظيم الدروس في أقسام لاحقاً
    };
    
    return { success: true, data: transformedCourse };
  } catch (error) {
    console.error('Error fetching course:', error);
    return { success: false, error };
  }
};

export const createCourse = async (courseData: any) => {
  try {
    const title = courseData.title || 'دورة بدون عنوان';

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

    const shortDescription =
      (courseData as any).short_description ??
      (courseData as any).shortDescription ??
      (courseData.description || '').slice(0, 200);

    const isPublished = !!courseData.isPublished;

    const { data, error } = await supabase
      .from('courses')
      .insert({
        title: courseData.title,
        slug,
        description: courseData.description,
        short_description: shortDescription,
        instructor_id: courseData.instructorId,
        price: courseData.price,
        discount_price: courseData.discountPrice,
        thumbnail: courseData.thumbnail,
        preview_video: courseData.previewVideo,
        category: courseData.category,
        level: courseData.level,
        duration_hours: courseData.duration,
        status: isPublished ? 'published' : 'draft',
        is_active: isPublished ? true : false,
        is_published: isPublished,
        is_featured: courseData.isFeatured || false
      })
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating course:', error);
    return { success: false, error };
  }
};

export const updateCourse = async (courseId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .update({
        title: updates.title,
        description: updates.description,
        price: updates.price,
        discount_price: updates.discountPrice,
        thumbnail: updates.thumbnail,
        category: updates.category,
        level: updates.level,
        duration_hours: updates.duration,
        is_published: updates.isPublished,
        is_featured: updates.isFeatured
      })
      .eq('id', courseId)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating course:', error);
    return { success: false, error };
  }
};

export const deleteCourse = async (courseId: string) => {
  try {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting course:', error);
    return { success: false, error };
  }
};

// ========================================
// دوال التسجيلات
// ========================================

export const getUserEnrollments = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        course:courses(*, instructor_user:users!courses_instructor_id_fkey(id, name, avatar_url, profile_picture))
      `)
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false });
    
    if (error) throw error;
    
    const transformedEnrollments = (data || []).map((enrollment: any) => {
      const course = enrollment?.course || null;
      const instructorName = course?.instructor_user?.name || null;
      const instructorImage =
        course?.instructor_user?.avatar_url ||
        course?.instructor_user?.profile_picture ||
        null;

      return {
        id: enrollment.id,
        courseId: enrollment.course_id,
        course: course
          ? {
              ...course,
              instructor_name: instructorName,
              instructor_image: instructorImage,
            }
          : null,
        status: enrollment.status,
        progress: enrollment.progress || 0,
        isActive: enrollment.is_active,
        enrolledAt: enrollment.enrolled_at,
        completedAt: enrollment.completed_at,
      };
    });
    
    return { success: true, data: transformedEnrollments };
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return { success: false, error };
  }
};

export const enrollInCourse = async (userId: string, courseId: string) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        user_id: userId,
        course_id: courseId,
        status: 'pending',
        progress: 0,
        is_active: true
      })
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error enrolling in course:', error);
    return { success: false, error };
  }
};

// ========================================
// دوال الإشعارات
// ========================================

export const getUserNotifications = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const transformedNotifications = (data || []).map(notif => ({
      id: notif.id,
      title: notif.title,
      message: notif.message,
      type: notif.type || 'info',
      isRead: notif.is_read || false,
      createdAt: notif.created_at,
      icon: notif.icon || '📢'
    }));
    
    return { success: true, data: transformedNotifications };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { success: false, error };
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error };
  }
};

// ========================================
// دوال الكتب (المكتبة)
// ========================================

export const getBooks = async () => {
  try {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const transformedBooks = (data || []).map(book => ({
      id: book.id,
      title: book.title,
      author: book.author,
      coverImage: book.cover_image || '/placeholder-book.jpg',
      category: book.category,
      rating: book.rating || 0,
      downloads: book.downloads || 0,
      views: book.views || 0,
      isPremium: book.is_premium || false,
      isNewRelease: book.is_new_release || false,
      description: book.description || '',
      year: book.year || new Date().getFullYear(),
      pdfUrl: book.pdf_url
    }));
    
    return { success: true, data: transformedBooks };
  } catch (error) {
    console.error('Error fetching books:', error);
    return { success: false, error };
  }
};

// ========================================
// دوال لوحة التحكم
// ========================================

export const getDashboardData = async (userId: string) => {
  try {
    const params = new URLSearchParams();
    params.set('userId', userId);

    const res = await fetch(`/api/student/dashboard?${params.toString()}`);

    if (!res.ok) {
      let body: any = null;
      try {
        body = await res.json();
      } catch {
        // ignore json parse error
      }

      console.error('Error fetching dashboard data via /api/student/dashboard:', res.status, body);
      return {
        success: false,
        error: body?.error || `Request failed with status ${res.status}`,
      };
    }

    const data = await res.json();

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return { success: false, error };
  }
};

// دالة مساعدة لحساب التقدم العام
const calculateOverallProgress = (enrollments: any[]) => {
  if (!enrollments || enrollments.length === 0) return 0;
  
  const totalProgress = enrollments.reduce((sum, enrollment) => {
    return sum + (enrollment.progress || 0);
  }, 0);
  
  return Math.round(totalProgress / enrollments.length);
};

// ========================================
// دوال المستخدمين
// ========================================

export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    const transformedUser = {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      avatar: data.avatar || '/default-avatar.png',
      bio: data.bio,
      city: data.city,
      gradeLevel: data.grade_level,
      specialty: data.specialty,
      rating: data.rating,
      isActive: data.is_active,
      isVerified: data.is_verified,
      createdAt: data.created_at
    };
    
    return { success: true, data: transformedUser };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { success: false, error };
  }
};

export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
        avatar: updates.avatar,
        bio: updates.bio,
        city: updates.city,
        grade_level: updates.gradeLevel
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error };
  }
};

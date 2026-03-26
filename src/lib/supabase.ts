import supabase from './supabase-client';

// إعادة استخدام العميل الموحد من supabase-client
export const getSupabase = () => supabase;
export { supabase };

// دوال مساعدة للمصادقة
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const signUp = async (email: string, password: string, metadata?: any) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// دوال مساعدة للكورسات
export const getCourses = async (filters?: any) => {
  try {
    let query = supabase
      .from('courses')
      .select('*, instructor_user:users!courses_instructor_id_fkey(id, name, avatar_url, profile_picture)');
    
    if (filters?.published !== undefined) {
      query = query.eq('is_published', filters.published);
    }
    
    if (filters?.featured !== undefined) {
      query = query.eq('is_featured', filters.featured);
    }
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;

    const enriched = (data || []).map((course: any) => ({
      ...course,
      instructor_name: course?.instructor_user?.name || course?.instructor_name || null,
      instructor_image:
        course?.instructor_user?.avatar_url ||
        course?.instructor_user?.profile_picture ||
        null,
    }));

    return { success: true, data: enriched };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getCourseById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*, instructor_user:users!courses_instructor_id_fkey(id, name, avatar_url, profile_picture)')
      .eq('id', id)
      .single();
    
    if (error) throw error;

    const enriched = data
      ? {
          ...data,
          instructor_name: (data as any)?.instructor_user?.name || (data as any)?.instructor_name || null,
          instructor_image:
            (data as any)?.instructor_user?.avatar_url ||
            (data as any)?.instructor_user?.profile_picture ||
            null,
        }
      : data;

    return { success: true, data: enriched };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getLessonsByCourseId = async (courseId: string) => {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });
    
    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// دوال مساعدة للمستخدمين
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// دوال مساعدة للتسجيلات
export const getEnrollments = async (userId?: string, courseId?: string) => {
  try {
    let query = supabase.from('enrollments').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (courseId) {
      query = query.eq('course_id', courseId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const createEnrollment = async (userId: string, courseId: string) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .insert({ user_id: userId, course_id: courseId })
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export default supabase;

// ========================================
// Supabase Admin Helper Functions
// ========================================

import supabase from '@/lib/supabase-client';

export { supabase };

// ========================================
// دوال المستخدمين
// ========================================

export const getUsers = async (role?: string) => {
  try {
    let query = supabase.from('users').select('*');
    
    if (role) {
      query = query.eq('role', role);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { success: false, error };
  }
};

export const deleteUser = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error };
  }
};

export const updateUser = async (userId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error };
  }
};

// ========================================
// دوال الكورسات
// ========================================

export const getCourses = async () => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching courses:', error);
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

export const updateCourse = async (courseId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .update(updates)
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

// ========================================
// دوال التسجيلات
// ========================================

export const getEnrollments = async () => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        user:users(*),
        course:courses(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return { success: false, error };
  }
};

export const updateEnrollment = async (enrollmentId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .update(updates)
      .eq('id', enrollmentId)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating enrollment:', error);
    return { success: false, error };
  }
};

export const deleteEnrollment = async (enrollmentId: string) => {
  try {
    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('id', enrollmentId);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    return { success: false, error };
  }
};

// ========================================
// دوال الدروس
// ========================================

export const getLessons = async (courseId?: string) => {
  try {
    let query = supabase.from('lessons').select('*');
    
    if (courseId) {
      query = query.eq('course_id', courseId);
    }
    
    const { data, error } = await query.order('order_index', { ascending: true });
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return { success: false, error };
  }
};

export const deleteLesson = async (lessonId: string) => {
  try {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return { success: false, error };
  }
};

// ========================================
// دوال الإنجازات
// ========================================

export const getAchievements = async () => {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('points', { ascending: false });
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return { success: false, error };
  }
};

export const getUserAchievements = async () => {
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        user:users(name, email),
        achievement:achievements(title, points, icon),
        course:courses(title)
      `)
      .order('earned_at', { ascending: false });
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    return { success: false, error };
  }
};

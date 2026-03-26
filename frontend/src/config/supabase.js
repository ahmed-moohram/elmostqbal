/**
 * إعداد الاتصال بـ Supabase
 * Supabase Connection Configuration
 */

import supabase from '@/lib/supabase-client';

// إعادة استخدام عميل Supabase الموحد
export { supabase };

// إعدادات إضافية (خيارات منطقية على مستوى الكود فقط)
// ملاحظة: خيارات auth/global/db تم ضبطها عند إنشاء العميل في supabase-client
// يمكن هنا فقط توثيق واستخدام نفس العميل

// ========================================
// دوال المصادقة
// ========================================

/**
 * تسجيل الدخول
 */
export const signIn = async(email, password) => {
    try {
        // محاولة تسجيل الدخول
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('Login error:', error);

            // معالجة أخطاء محددة
            if (error.message.includes('Invalid login credentials')) {
                throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
            } else if (error.message.includes('Email not confirmed')) {
                throw new Error('يرجى تأكيد بريدك الإلكتروني أولاً');
            } else if (error.message.includes('Too many requests')) {
                throw new Error('محاولات كثيرة. يرجى الانتظار قليلاً');
            } else {
                throw new Error('حدث خطأ في تسجيل الدخول. يرجى المحاولة لاحقاً');
            }
        }

        // جلب معلومات المستخدم الإضافية
        if (data.user) {
            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();

            return {
                user: {...data.user, profile },
                session: data.session
            };
        }

        return { user: data.user, session: data.session };
    } catch (error) {
        console.error('Sign in error:', error);
        throw error;
    }
};

/**
 * تسجيل الدخول بالهاتف (بديل)
 */
export const signInWithPhone = async(phone, password) => {
    try {
        // البحث عن المستخدم بالهاتف
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('email')
            .eq('student_phone', phone)
            .single();

        if (userError || !userData) {
            throw new Error('رقم الهاتف غير مسجل');
        }

        // تسجيل الدخول بالبريد الإلكتروني
        return await signIn(userData.email, password);
    } catch (error) {
        console.error('Phone sign in error:', error);
        throw error;
    }
};

/**
 * تسجيل مستخدم جديد
 */
export const signUp = async(userData) => {
    try {
        // إنشاء حساب في Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    name: userData.name,
                    phone: userData.phone
                }
            }
        });

        if (authError) {
            console.error('Signup auth error:', authError);
            throw new Error('فشل إنشاء الحساب: ' + authError.message);
        }

        // إنشاء ملف المستخدم في جدول users
        if (authData.user) {
            const { error: profileError } = await supabase
                .from('users')
                .insert({
                    id: authData.user.id,
                    name: userData.name,
                    student_phone: userData.studentPhone,
                    parent_phone: userData.parentPhone,
                    email: userData.email,
                    password_hash: 'handled_by_auth', // Auth يتولى التشفير
                    role: userData.role || 'student',
                    grade_level: userData.gradeLevel,
                    city: userData.city || 'السويس',
                    school_name: userData.schoolName
                });

            if (profileError) {
                console.error('Profile creation error:', profileError);
                // حذف حساب Auth إذا فشل إنشاء الملف
                await supabase.auth.admin.deleteUser(authData.user.id);
                throw new Error('فشل إنشاء ملف المستخدم');
            }
        }

        return authData;
    } catch (error) {
        console.error('Sign up error:', error);
        throw error;
    }
};

/**
 * تسجيل الخروج
 */
export const signOut = async() => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        // تنظيف التخزين المحلي
        localStorage.clear();
        sessionStorage.clear();

        return true;
    } catch (error) {
        console.error('Sign out error:', error);
        throw error;
    }
};

/**
 * الحصول على المستخدم الحالي
 */
export const getCurrentUser = async() => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) throw error;

        if (user) {
            // جلب معلومات إضافية
            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            return {...user, profile };
        }

        return null;
    } catch (error) {
        console.error('Get current user error:', error);
        return null;
    }
};

/**
 * تحديث الجلسة
 */
export const refreshSession = async() => {
    try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) throw error;
        return data.session;
    } catch (error) {
        console.error('Refresh session error:', error);
        throw error;
    }
};

// ========================================
// دوال البيانات
// ========================================

/**
 * جلب الكورسات
 */
export const fetchCourses = async(filters = {}) => {
    try {
        let query = supabase
            .from('courses')
            .select(`
        *,
        instructor:users!instructor_id(id, name, email),
        sections(count)
      `)
            .eq('status', 'published')
            .eq('is_active', true);

        // تطبيق الفلاتر
        if (filters.category) {
            query = query.eq('category', filters.category);
        }
        if (filters.level) {
            query = query.eq('level', filters.level);
        }
        if (filters.search) {
            query = query.ilike('title', `%${filters.search}%`);
        }

        // الترتيب
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) {
            console.error('Fetch courses error:', error);
            throw new Error('فشل جلب الكورسات');
        }

        return data || [];
    } catch (error) {
        console.error('Courses error:', error);
        throw error;
    }
};

/**
 * جلب كورس واحد
 */
export const fetchCourse = async(courseId) => {
    try {
        const { data, error } = await supabase
            .from('courses')
            .select(`
        *,
        instructor:users!instructor_id(id, name, email, profile_picture),
        sections(
          id, title, description, order_index,
          lessons(
            id, title, description, duration, is_preview, order_index
          )
        ),
        course_outcomes(outcome),
        course_requirements(requirement),
        course_features(feature)
      `)
            .eq('id', courseId)
            .single();

        if (error) {
            console.error('Fetch course error:', error);
            throw new Error('فشل جلب الكورس');
        }

        return data;
    } catch (error) {
        console.error('Course error:', error);
        throw error;
    }
};

/**
 * التسجيل في كورس
 */
export const enrollInCourse = async(courseId, paymentInfo) => {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('يجب تسجيل الدخول أولاً');

        // إنشاء طلب تسجيل
        const { data, error } = await supabase
            .from('enrollment_requests')
            .insert({
                student_id: user.id,
                course_id: courseId,
                payment_method: paymentInfo.method,
                payment_amount: paymentInfo.amount,
                transaction_id: paymentInfo.transactionId,
                receipt_image: paymentInfo.receiptImage,
                student_name: user.profile.name,
                student_phone: user.profile.student_phone,
                parent_phone: user.profile.parent_phone,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            console.error('Enrollment error:', error);
            throw new Error('فشل التسجيل في الكورس');
        }

        return data;
    } catch (error) {
        console.error('Enroll error:', error);
        throw error;
    }
};

// ========================================
// Realtime Subscriptions
// ========================================

/**
 * الاشتراك في الإشعارات
 */
export const subscribeToNotifications = (userId, callback) => {
    return supabase
        .channel('notifications')
        .on(
            'postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            },
            (payload) => {
                callback(payload.new);
            }
        )
        .subscribe();
};

/**
 * الاشتراك في رسائل الدردشة
 */
export const subscribeToMessages = (sessionId, callback) => {
    return supabase
        .channel(`session-${sessionId}`)
        .on(
            'postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'session_messages',
                filter: `session_id=eq.${sessionId}`
            },
            (payload) => {
                callback(payload.new);
            }
        )
        .subscribe();
};

// ========================================
// معالجة الأخطاء العامة
// ========================================

/**
 * معالج أخطاء الاتصال
 */
export const handleConnectionError = (error) => {
    console.error('Connection error:', error);

    const message = error && typeof error.message === 'string' ? error.message : '';

    // التحقق من نوع الخطأ
    if (!navigator.onLine) {
        return 'لا يوجد اتصال بالإنترنت';
    } else if (message.includes('Failed to fetch')) {
        return 'لا يمكن الاتصال بالخادم. تحقق من اتصالك بالإنترنت';
    } else if (message.includes('NetworkError')) {
        return 'خطأ في الشبكة. يرجى المحاولة لاحقاً';
    } else if (message.includes('CORS')) {
        return 'خطأ في إعدادات الخادم';
    } else {
        return message || 'حدث خطأ غير متوقع';
    }
};

/**
 * إعادة المحاولة عند الفشل
 */
export const retryOperation = async(operation, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
    }
};

// ========================================
// التصدير
// ========================================

export default supabase;
/**
 * Supabase Authentication - نظام مصادقة حقيقي
 */

import supabase from '@/lib/supabase-client';

// إعادة استخدام عميل Supabase المشترك للمصادقة
export { supabase };

/**
 * تسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور
 */
export async function signInWithEmail(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('Supabase Auth Error:', error);
            return { success: false, error: error.message };
        }

        // جلب بيانات المستخدم من جدول users
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (userError) {
            console.warn('Could not fetch user profile:', userError);
        }

        return {
            success: true,
            user: {
                ...data.user,
                ...userData,
                token: data.session ? .access_token
            },
            session: data.session
        };
    } catch (error) {
        console.error('Sign in error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * تسجيل الدخول باستخدام رقم الهاتف
 * ملاحظة: يحتاج إعداد Twilio في Supabase
 */
export async function signInWithPhone(phone, password) {
    // محاولة البحث عن المستخدم بالهاتف أولاً
    try {
        const { data: userData, error: searchError } = await supabase
            .from('users')
            .select('email')
            .eq('phone', phone)
            .single();

        if (searchError || !userData) {
            return { success: false, error: 'رقم الهاتف غير مسجل' };
        }

        // تسجيل الدخول بالبريد الإلكتروني المرتبط
        return signInWithEmail(userData.email, password);
    } catch (error) {
        console.error('Phone sign in error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * إنشاء حساب جديد
 */
export async function signUp(email, password, metadata = {}) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata // بيانات إضافية مثل الاسم والهاتف
            }
        });

        if (error) {
            console.error('Supabase SignUp Error:', error);
            return { success: false, error: error.message };
        }

        // إضافة المستخدم لجدول users
        if (data.user) {
            const { error: insertError } = await supabase
                .from('users')
                .insert({
                    id: data.user.id,
                    email: email,
                    name: metadata.name || '',
                    phone: metadata.phone || '',
                    role: metadata.role || 'student',
                    created_at: new Date().toISOString()
                });

            if (insertError) {
                console.warn('Could not create user profile:', insertError);
            }
        }

        return {
            success: true,
            user: data.user,
            session: data.session,
            message: 'تم إنشاء الحساب بنجاح. يرجى تأكيد البريد الإلكتروني.'
        };
    } catch (error) {
        console.error('Sign up error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * تسجيل الخروج
 */
export async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (error) {
        console.error('Sign out error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * الحصول على المستخدم الحالي
 */
export async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return null;
        }

        // جلب بيانات إضافية من جدول users
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (userError) {
            console.warn('Could not fetch user profile:', userError);
        }

        return {
            ...user,
            ...userData
        };
    } catch (error) {
        console.error('Get current user error:', error);
        return null;
    }
}

/**
 * الاستماع لتغييرات حالة المصادقة
 */
export function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
}

/**
 * تحديث كلمة المرور
 */
export async function updatePassword(newPassword) {
    try {
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Update password error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * إعادة تعيين كلمة المرور
 */
export async function resetPassword(email) {
    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني' };
    } catch (error) {
        console.error('Reset password error:', error);
        return { success: false, error: error.message };
    }
}

export default supabase;
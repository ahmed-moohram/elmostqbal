/**
 * مساعد المصادقة - يدمج بين الخادم الحقيقي والبيانات التجريبية
 * Authentication Helper - Combines Real Server and Mock Data
 */

import { authService } from '../services/api';
import mockAuth from '../services/mockAuth';
import { signIn, signUp, signOut, getCurrentUser } from '../config/supabase';

// تحديد وضع العمل
const USE_MOCK = process.env.REACT_APP_USE_MOCK === 'true' || true; // افتراضياً استخدم Mock
const USE_SUPABASE = process.env.REACT_APP_USE_SUPABASE === 'true' || false;

/**
 * تسجيل الدخول الذكي
 * يحاول الاتصال بالخادم أولاً، ثم Supabase، ثم البيانات التجريبية
 */
export const smartLogin = async (credentials) => {
  console.log('🔐 محاولة تسجيل الدخول...');
  
  // محاولة 1: الخادم المحلي
  if (!USE_MOCK) {
    try {
      console.log('📡 محاولة الاتصال بالخادم المحلي...');
      const response = await authService.login(credentials);
      
      if (response && response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('authMode', 'server');
        console.log('✅ تم تسجيل الدخول عبر الخادم');
        return response;
      }
    } catch (error) {
      console.warn('⚠️ فشل الاتصال بالخادم:', error.message);
    }
  }
  
  // محاولة 2: Supabase
  if (USE_SUPABASE) {
    try {
      console.log('☁️ محاولة الاتصال بـ Supabase...');
      const { user, session } = await signIn(credentials.email, credentials.password);
      
      if (user) {
        localStorage.setItem('token', session.access_token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('authMode', 'supabase');
        console.log('✅ تم تسجيل الدخول عبر Supabase');
        return { user, token: session.access_token };
      }
    } catch (error) {
      console.warn('⚠️ فشل الاتصال بـ Supabase:', error.message);
    }
  }
  
  // محاولة 3: البيانات التجريبية
  try {
    console.log('🎭 استخدام البيانات التجريبية...');
    const response = await mockAuth.login(credentials.email || credentials.phone, credentials.password);
    
    if (response.success) {
      localStorage.setItem('authMode', 'mock');
      console.log('✅ تم تسجيل الدخول بالبيانات التجريبية');
      
      // عرض رسالة للمستخدم
      if (typeof window !== 'undefined' && window.showNotification) {
        window.showNotification('info', 'أنت تستخدم الوضع التجريبي. البيانات غير حقيقية.');
      }
      
      return response;
    }
  } catch (error) {
    console.error('❌ فشل تسجيل الدخول:', error.message);
    throw error;
  }
  
  throw new Error('فشل تسجيل الدخول. تحقق من البيانات المدخلة.');
};

/**
 * التسجيل الذكي
 */
export const smartRegister = async (userData) => {
  console.log('📝 محاولة إنشاء حساب جديد...');
  
  // محاولة 1: الخادم المحلي
  if (!USE_MOCK) {
    try {
      const response = await authService.register(userData);
      if (response) {
        localStorage.setItem('authMode', 'server');
        console.log('✅ تم إنشاء الحساب عبر الخادم');
        return response;
      }
    } catch (error) {
      console.warn('⚠️ فشل الاتصال بالخادم:', error.message);
    }
  }
  
  // محاولة 2: Supabase
  if (USE_SUPABASE) {
    try {
      const response = await signUp(userData);
      if (response) {
        localStorage.setItem('authMode', 'supabase');
        console.log('✅ تم إنشاء الحساب عبر Supabase');
        return response;
      }
    } catch (error) {
      console.warn('⚠️ فشل الاتصال بـ Supabase:', error.message);
    }
  }
  
  // محاولة 3: البيانات التجريبية
  try {
    const response = await mockAuth.register(userData);
    if (response.success) {
      localStorage.setItem('authMode', 'mock');
      console.log('✅ تم إنشاء الحساب بالبيانات التجريبية');
      return response;
    }
  } catch (error) {
    console.error('❌ فشل إنشاء الحساب:', error.message);
    throw error;
  }
  
  throw new Error('فشل إنشاء الحساب. يرجى المحاولة لاحقاً.');
};

/**
 * تسجيل الخروج
 */
export const smartLogout = async () => {
  const authMode = localStorage.getItem('authMode');
  
  try {
    if (authMode === 'supabase') {
      await signOut();
    } else if (authMode === 'server') {
      authService.logout();
    } else {
      mockAuth.logout();
    }
  } catch (error) {
    console.error('خطأ في تسجيل الخروج:', error);
  }
  
  // تنظيف التخزين المحلي
  localStorage.clear();
  sessionStorage.clear();
  
  // إعادة التوجيه
  window.location.href = '/login';
};

/**
 * الحصول على المستخدم الحالي
 */
export const smartGetCurrentUser = async () => {
  const authMode = localStorage.getItem('authMode');
  
  try {
    if (authMode === 'supabase') {
      return await getCurrentUser();
    } else if (authMode === 'server') {
      return await authService.getCurrentUser();
    } else {
      return mockAuth.getCurrentUser();
    }
  } catch (error) {
    console.error('خطأ في جلب المستخدم:', error);
    return null;
  }
};

/**
 * التحقق من المصادقة
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token') || mockAuth.isAuthenticated();
};

/**
 * جلب الكورسات بذكاء
 */
export const smartGetCourses = async (filters = {}) => {
  const authMode = localStorage.getItem('authMode');
  
  try {
    if (authMode === 'server' && !USE_MOCK) {
      const { coursesService } = await import('../services/api');
      return await coursesService.getAllCourses();
    } else if (authMode === 'supabase' && USE_SUPABASE) {
      const { fetchCourses } = await import('../config/supabase');
      return await fetchCourses(filters);
    } else {
      return await mockAuth.getCourses(filters);
    }
  } catch (error) {
    console.warn('⚠️ فشل جلب الكورسات، استخدام البيانات التجريبية');
    return await mockAuth.getCourses(filters);
  }
};

/**
 * عرض رسالة معلومات للمستخدم
 */
export const showAuthInfo = () => {
  const authMode = localStorage.getItem('authMode');
  
  if (authMode === 'mock') {
    console.log(`
╔════════════════════════════════════════╗
║     🎭 الوضع التجريبي نشط 🎭         ║
╠════════════════════════════════════════╣
║ يمكنك تسجيل الدخول باستخدام:          ║
║                                        ║
║ 📧 البريد: test@test.com              ║
║ 🔑 كلمة المرور: 123                   ║
║                                        ║
║ أو                                     ║
║                                        ║
║ 📧 البريد: student@test.com           ║
║ 🔑 كلمة المرور: 123456                ║
╚════════════════════════════════════════╝
    `);
  }
};

// عرض معلومات المصادقة عند التحميل
if (typeof window !== 'undefined') {
  window.addEventListener('load', showAuthInfo);
}

// تصدير الدوال
export default {
  login: smartLogin,
  register: smartRegister,
  logout: smartLogout,
  getCurrentUser: smartGetCurrentUser,
  isAuthenticated,
  getCourses: smartGetCourses,
  showAuthInfo
};

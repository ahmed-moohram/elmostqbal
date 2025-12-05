import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

// تعريف نوع المستخدم
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  avatar?: string;
}

// تعريف نوع Token JWT
interface JwtPayload {
  sub: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  avatar?: string;
  iat: number;
  exp: number;
}

// مدة صلاحية الـ token بالثواني (7 أيام)
const TOKEN_EXPIRY = 60 * 60 * 24 * 7;

// الكلمة السرية لتوقيع الـ JWT
const TOKEN_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_replace_in_production';

// اسم الـ cookie
const AUTH_COOKIE_NAME = 'auth_token';

// الخيارات الآمنة للـ cookie
const cookieOptions = {
  expires: 7, // 7 أيام
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/'
};

/**
 * تسجيل دخول المستخدم وتخزين الـ token في cookie
 */
export const login = (token: string): User | null => {
  try {
    // فك تشفير الـ token
    const decoded = jwtDecode<JwtPayload>(token);
    
    // التحقق من انتهاء صلاحية الـ token
    if (decoded.exp * 1000 < Date.now()) {
      logout();
      return null;
    }
    
    // تخزين الـ token في cookie بدلاً من localStorage
    Cookies.set(AUTH_COOKIE_NAME, token, cookieOptions);
    
    // إرجاع معلومات المستخدم
    const user: User = {
      id: decoded.sub,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
      avatar: decoded.avatar
    };
    
    return user;
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    return null;
  }
};

/**
 * تسجيل خروج المستخدم وحذف الـ token
 */
export const logout = (): void => {
  Cookies.remove(AUTH_COOKIE_NAME);
};

/**
 * الحصول على الـ token الحالي
 */
export const getToken = (): string | null => {
  return Cookies.get(AUTH_COOKIE_NAME) || null;
};

/**
 * الحصول على المستخدم الحالي
 */
export const getCurrentUser = (): User | null => {
  const token = getToken();
  
  if (!token) {
    return null;
  }
  
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    
    // التحقق من انتهاء صلاحية الـ token
    if (decoded.exp * 1000 < Date.now()) {
      logout();
      return null;
    }
    
    const user: User = {
      id: decoded.sub,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
      avatar: decoded.avatar
    };
    
    return user;
  } catch (error) {
    console.error('خطأ في الحصول على المستخدم الحالي:', error);
    return null;
  }
};

/**
 * التحقق من صلاحية الدخول
 */
export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null;
};

/**
 * التحقق من دور المستخدم
 */
export const hasRole = (roles: ('student' | 'teacher' | 'admin')[]): boolean => {
  const user = getCurrentUser();
  
  if (!user) {
    return false;
  }
  
  return roles.includes(user.role);
};

/**
 * إنشاء Interceptor لإضافة token الدخول إلى طلبات HTTP
 */
export const getAuthorizationHeader = (): { Authorization: string } | {} => {
  const token = getToken();
  
  if (!token) {
    return {};
  }
  
  return {
    Authorization: `Bearer ${token}`
  };
};

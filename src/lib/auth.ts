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

type CookieOptions = {
  expires?: number;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  path?: string;
};

const setCookie = (name: string, value: string, options: CookieOptions = {}): void => {
  if (typeof document === 'undefined') return;

  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (typeof options.expires === 'number') {
    const expiresDate = new Date();
    expiresDate.setTime(expiresDate.getTime() + options.expires * 24 * 60 * 60 * 1000);
    cookie += `; Expires=${expiresDate.toUTCString()}`;
  }
  if (options.path) cookie += `; Path=${options.path}`;
  if (options.sameSite) cookie += `; SameSite=${options.sameSite}`;
  if (options.secure) cookie += '; Secure';

  document.cookie = cookie;
};

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const encodedName = encodeURIComponent(name) + '=';
  const parts = (document.cookie || '').split('; ');

  for (const part of parts) {
    if (part.startsWith(encodedName)) {
      return decodeURIComponent(part.substring(encodedName.length));
    }
  }
  return null;
};

const removeCookie = (name: string, options: CookieOptions = {}): void => {
  if (typeof document === 'undefined') return;
  let cookie = `${encodeURIComponent(name)}=; Expires=${new Date(0).toUTCString()}`;
  if (options.path) cookie += `; Path=${options.path}`;
  if (options.sameSite) cookie += `; SameSite=${options.sameSite}`;
  if (options.secure) cookie += '; Secure';
  document.cookie = cookie;
};

const base64UrlDecodeToUtf8 = (base64Url: string): string => {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

  const atobFn = (globalThis as any)?.atob as ((input: string) => string) | undefined;
  if (typeof atobFn === 'function') {
    const binary = atobFn(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const textDecoder = (globalThis as any)?.TextDecoder as (new () => TextDecoder) | undefined;
    if (typeof textDecoder === 'function') {
      return new textDecoder().decode(bytes);
    }

    let result = '';
    for (let i = 0; i < bytes.length; i++) result += String.fromCharCode(bytes[i]);
    return decodeURIComponent(escape(result));
  }

  const bufferCtor = (globalThis as any)?.Buffer as any;
  if (bufferCtor) {
    return bufferCtor.from(padded, 'base64').toString('utf-8');
  }

  throw new Error('JWT decode not supported in this runtime');
};

const decodeJwt = <T,>(token: string): T => {
  const parts = token.split('.');
  if (parts.length < 2) throw new Error('Invalid token');
  const json = base64UrlDecodeToUtf8(parts[1]);
  return JSON.parse(json) as T;
};

/**
 * تسجيل دخول المستخدم وتخزين الـ token في cookie
 */
export const login = (token: string): User | null => {
  try {
    // فك تشفير الـ token
    const decoded = decodeJwt<JwtPayload>(token);
    
    // التحقق من انتهاء صلاحية الـ token
    if (decoded.exp * 1000 < Date.now()) {
      logout();
      return null;
    }
    
    // تخزين الـ token في cookie بدلاً من localStorage
    setCookie(AUTH_COOKIE_NAME, token, cookieOptions);
    
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
  removeCookie(AUTH_COOKIE_NAME, cookieOptions);
};

/**
 * الحصول على الـ token الحالي
 */
export const getToken = (): string | null => {
  return getCookie(AUTH_COOKIE_NAME);
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
    const decoded = decodeJwt<JwtPayload>(token);
    
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

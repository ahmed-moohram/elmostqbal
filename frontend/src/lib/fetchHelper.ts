/**
 * Fetch Helper - دوال مساعدة لاستدعاءات API
 * يوفر دوال موحدة لجميع طلبات HTTP في التطبيق
 */

import { API_BASE_URL } from '@/lib/api';

interface FetchOptions extends RequestInit {
  token?: string | null;
  useAuth?: boolean;
}

/**
 * دالة مساعدة لاستدعاء API مع معالجة الأخطاء
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, useAuth = true, ...fetchOptions } = options;

  // إزالة / في البداية من endpoint
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // بناء URL كامل
  const url = `${API_BASE_URL}/api/${cleanEndpoint}`;

  // إعداد الـ headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // إضافة token للمصادقة إذا كان متاحًا
  if (useAuth) {
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // معالجة الأخطاء
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'حدث خطأ غير متوقع' }));
      throw new Error(errorData.message || `HTTP Error: ${response.status}`);
    }

    // معالجة الاستجابة
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return null as T;
  } catch (error) {
    console.error('API Fetch Error:', error);
    throw error;
  }
}

/**
 * GET request
 */
export async function apiGet<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  return apiFetch<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request
 */
export async function apiPost<T = any>(
  endpoint: string,
  data?: any,
  options: FetchOptions = {}
): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request
 */
export async function apiPut<T = any>(
  endpoint: string,
  data?: any,
  options: FetchOptions = {}
): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PATCH request
 */
export async function apiPatch<T = any>(
  endpoint: string,
  data?: any,
  options: FetchOptions = {}
): Promise<T> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request
 */
export async function apiDelete<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  return apiFetch<T>(endpoint, { ...options, method: 'DELETE' });
}

/**
 * فحص اتصال الخادم
 */
export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health-check`, {
      method: 'GET',
      cache: 'no-cache',
    });
    return response.ok;
  } catch (error) {
    console.error('Server health check failed:', error);
    return false;
  }
}

/**
 * استدعاءات API محددة للمصادقة
 */
export const authAPI = {
  login: (credentials: { studentPhone: string; password: string }) =>
    apiPost('/auth/login', credentials, { useAuth: false }),

  register: (userData: any) =>
    apiPost('/auth/register', userData, { useAuth: false }),

  getCurrentUser: () =>
    apiGet('/auth/me'),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },
};

/**
 * استدعاءات API محددة للدورات
 */
export const coursesAPI = {
  getAll: (params?: Record<string, any>) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiGet(`/courses${queryString}`);
  },

  getById: (id: string | number) =>
    apiGet(`/courses/${id}`),

  enroll: (courseId: string | number) =>
    apiPost(`/courses/${courseId}/enroll`),

  getProgress: (courseId: string | number) =>
    apiGet(`/courses/${courseId}/progress`),

  markLessonComplete: (courseId: string | number, lessonId: string) =>
    apiPost(`/courses/${courseId}/lessons/${lessonId}/complete`),
};

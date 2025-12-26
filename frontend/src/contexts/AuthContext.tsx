"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { API_BASE_URL } from '@/lib/api';
import supabase from '@/lib/supabase-client';
import { verifyPassword } from '@/lib/security/password-utils';

 const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface User {
  id: string;
  name: string;
  email?: string;
  role: 'student' | 'teacher' | 'admin';
  phone?: string;
  image?: string;
  isVerified?: boolean;
  enrolledCourses?: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const resolveUserUuidByPhone = async (phone: string, preferredRole?: string): Promise<string | null> => {
    const normalizedPhone = String(phone || '').trim();
    if (!normalizedPhone) return null;

    const tryWithPhoneColumn = async () =>
      supabase
        .from('users')
        .select('id, role')
        .or(
          `phone.eq.${normalizedPhone},student_phone.eq.${normalizedPhone},parent_phone.eq.${normalizedPhone},mother_phone.eq.${normalizedPhone}`
        )
        .limit(10);

    const tryWithoutPhoneColumn = async () =>
      supabase
        .from('users')
        .select('id, role')
        .or(
          `student_phone.eq.${normalizedPhone},parent_phone.eq.${normalizedPhone},mother_phone.eq.${normalizedPhone}`
        )
        .limit(10);

    let { data, error } = await tryWithPhoneColumn();

    if (error && typeof error.message === 'string' && error.message.toLowerCase().includes('phone')) {
      ({ data, error } = await tryWithoutPhoneColumn());
    }

    if (error) {
      console.error('Error resolving user UUID:', error);
      return null;
    }

    const rows: any[] = Array.isArray(data) ? (data as any[]) : data ? [data as any] : [];
    const preferred = preferredRole
      ? rows.find((row) => String((row as any)?.role || '').toLowerCase() === String(preferredRole).toLowerCase())
      : null;
    const picked = preferred || rows[0] || null;

    const resolved = picked?.id ? String(picked.id) : null;
    if (resolved && UUID_REGEX.test(resolved)) return resolved;
    return null;
  };

  // تحميل بيانات المستخدم عند بدء التطبيق
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          const parsed = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsed);

          if (typeof document !== 'undefined' && parsed?.id && parsed?.role) {
            document.cookie = `auth-token=${encodeURIComponent(storedToken)}; path=/`;
            document.cookie = `user-role=${encodeURIComponent(parsed.role)}; path=/`;
            document.cookie = `user-id=${encodeURIComponent(parsed.id)}; path=/`;
          }

          const parsedPhone =
            (parsed as any)?.phone ||
            (parsed as any)?.student_phone ||
            (parsed as any)?.studentPhone ||
            (parsed as any)?.parent_phone ||
            (parsed as any)?.parentPhone ||
            (parsed as any)?.mother_phone ||
            (parsed as any)?.motherPhone ||
            null;

          const parsedId = typeof parsed?.id === 'string' ? String(parsed.id) : '';
          if (parsedPhone && parsedId && !UUID_REGEX.test(parsedId)) {
            try {
              const resolvedId = await resolveUserUuidByPhone(String(parsedPhone), String(parsed?.role || ''));

              if (resolvedId && String(resolvedId) !== String(parsedId)) {
                const updated = { ...parsed, id: String(resolvedId) };
                localStorage.setItem('user', JSON.stringify(updated));
                setUser(updated);

                if (typeof document !== 'undefined') {
                  document.cookie = `user-id=${encodeURIComponent(updated.id)}; path=/`;
                }
              }
            } catch (resolveErr) {
              console.error('Error resolving user UUID on load:', resolveErr);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // تسجيل الدخول
  const login = async (phone: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (phone === '01005209667' && password === 'Ahmed@010052') {
        let adminUser: User = {
          id: 'admin-001',
          name: 'أحمد - مدير المنصة',
          email: 'admin@platform.com',
          phone: '01005209667',
          role: 'admin',
          isVerified: true,
        };

        try {
          const resolvedId = adminUser.phone ? await resolveUserUuidByPhone(adminUser.phone, 'admin') : null;
          if (resolvedId) {
            adminUser = { ...adminUser, id: String(resolvedId) };
          }
        } catch (resolveErr) {
          console.error('Error resolving admin UUID on login:', resolveErr);
        }

        const token = 'admin-token-' + Date.now();

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(adminUser));
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('isAuthenticated', 'true');
        setToken(token);
        setUser(adminUser);

        setTimeout(() => {
          window.location.reload();
        }, 500);

        return { success: true };
      }

      // التحقق من التخزين المحلي أولاً
      const USE_LOCAL_STORAGE = false; // استخدام Supabase الحقيقي
      
      if (USE_LOCAL_STORAGE) {
        console.log('📦 محاولة تسجيل الدخول محلياً...');
        
        // جلب المستخدمين المحليين
        const localUsers = JSON.parse(localStorage.getItem('localUsers') || '[]');
        
        // البحث عن المستخدم
        const user = localUsers.find((u: any) => 
          (u.phone === phone || u.email === phone) && 
          u.password === btoa(password)
        );
        
        if (user) {
          const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role as 'student' | 'teacher' | 'admin',
            isVerified: true
          };
          
          const token = 'local-token-' + Date.now();
          
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('isAuthenticated', 'true');
          setToken(token);
          setUser(userData);
          
          console.log('✅ تسجيل دخول محلي ناجح');
          
          // إعادة تحميل الصفحة لتحديث الـ Navbar
          setTimeout(() => {
            window.location.reload();
          }, 500);
          
          return { success: true };
        }
        
        // التحقق من حساب الأدمن المحدد مسبقاً
        if (phone === '01005209667' && password === 'Ahmed@010052') {
          const adminUser = {
            id: 'admin-001',
            name: 'أحمد - مدير المنصة',
            email: 'admin@platform.com',
            phone: '01005209667',
            role: 'admin' as const,
            isVerified: true
          };
          
          const token = 'admin-token-' + Date.now();
          
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(adminUser));
          localStorage.setItem('isAuthenticated', 'true');
          setToken(token);
          setUser(adminUser);
          
          console.log('✅ دخول الأدمن');
          
          // إعادة تحميل الصفحة لتحديث الـ Navbar
          setTimeout(() => {
            window.location.reload();
          }, 500);
          
          return { success: true };
        }
        
        return { success: false, error: 'رقم الهاتف أو كلمة المرور غير صحيحة' };
      }
      
      // استخدام Supabase الحقيقي (المشروع الجديد عبر supabase-client)
      console.log('🔄 الاتصال بـ Supabase (مشروع chikf)...');
      
      // البحث عن المستخدم في جدول users
      console.log('🔍 البحث عن المستخدم برقم:', phone);
      const tryWithPhoneColumn = async () =>
        supabase
          .from('users')
          .select('*')
          .or(
            `phone.eq.${phone},student_phone.eq.${phone},parent_phone.eq.${phone},mother_phone.eq.${phone},email.eq.${phone}`
          )
          .single();

      const tryWithoutPhoneColumn = async () =>
        supabase
          .from('users')
          .select('*')
          .or(`student_phone.eq.${phone},parent_phone.eq.${phone},mother_phone.eq.${phone},email.eq.${phone}`)
          .single();

      let { data: user, error } = await tryWithPhoneColumn();

      if (error && typeof error.message === 'string' && error.message.toLowerCase().includes('phone')) {
        ({ data: user, error } = await tryWithoutPhoneColumn());
      }
      
      console.log('📊 نتيجة البحث:', { user, error });
      
      if (error || !user) {
        console.log('❌ المستخدم غير موجود');
        return { success: false, error: 'رقم الهاتف أو كلمة المرور غير صحيحة' };
      }
      
      // التحقق من كلمة المرور
      let isPasswordValid = false;
      
      // أولوية لاستخدام password_hash (المستخدمون الجدد)
      if (user.password_hash) {
        isPasswordValid = await verifyPassword(password, user.password_hash);
      } else if (user.password) {
        // دعم قديم لكلمة المرور المخزنة بنص مشفر بسيط (base64)
        const encodedPassword = btoa(password);
        console.log('🔐 مقارنة كلمة المرور (وضع متوافق للخلف):');
        console.log('   - المدخلة (مشفرة):', encodedPassword);
        console.log('   - المحفوظة:', user.password);
        isPasswordValid = user.password === encodedPassword;
      }
      
      if (!isPasswordValid) {
        console.log('❌ كلمة المرور غير صحيحة');
        return { success: false, error: 'رقم الهاتف أو كلمة المرور غير صحيحة' };
      }
      
      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || user.student_phone || user.parent_phone || user.mother_phone,
        role: user.role as 'student' | 'teacher' | 'admin',
        isVerified: true
      };
      
      const token = 'supabase-token-' + Date.now();
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('isAuthenticated', 'true');
      setToken(token);
      setUser(userData);
      
      console.log('✅ تسجيل دخول ناجح عبر Supabase');
      console.log('   Token:', token);
      console.log('   User:', userData.name);
      
      // إعادة تحميل الصفحة لتحديث الـ Navbar
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
      return { success: true };
      
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: 'حدث خطأ في تسجيل الدخول' };
    }
  };

  // التسجيل
  const register = async (data: any): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.message || 'فشل التسجيل' };
      }

      // حفظ البيانات
      if (result.token) {
        const userWithToken = { ...result.user, token: result.token };
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(userWithToken));
        setToken(result.token);
        setUser(result.user);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Register error:', error);
      return { success: false, error: 'حدث خطأ في الاتصال بالخادم' };
    }
  };

  // تسجيل الخروج
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    router.replace('/');
  };

  // تحديث بيانات المستخدم
  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      const updatedUserWithToken = { ...updatedUser, token };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUserWithToken));
    }
  };

  // تحديث بيانات المستخدم من الخادم
  const refreshUser = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const userWithToken = { ...data.user, token };
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(userWithToken));
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook للوصول للـ Context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// HOC لحماية الصفحات
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles?: ('student' | 'teacher' | 'admin')[]
) {
  return function ProtectedComponent(props: P) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading) {
        if (!user) {
          router.replace('/login');
        } else if (allowedRoles && !allowedRoles.includes(user.role)) {
          router.replace('/unauthorized');
        }
      }
    }, [user, isLoading, router]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
      return null;
    }

    return <Component {...props} />;
  };
}

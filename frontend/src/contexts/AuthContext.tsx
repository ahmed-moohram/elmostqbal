"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { API_BASE_URL } from '@/lib/api';

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

  // تحميل بيانات المستخدم عند بدء التطبيق
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
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
      
      // استخدام Supabase الحقيقي
      console.log('🔄 الاتصال بـ Supabase...');
      
      const { createClient } = await import('@supabase/supabase-js');
      const SUPABASE_URL = 'https://wnqifmvgvlmxgswhcwnc.supabase.co';
      const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducWlmbXZndmxteGdzd2hjd25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MzYwNTUsImV4cCI6MjA3ODAxMjA1NX0.LqWhTZYmr7nu-dIy2uBBqntOxoWM-waluYIR9bipC9M';
      
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      
      // البحث عن المستخدم
      console.log('🔍 البحث عن المستخدم برقم:', phone);
      
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .or(`phone.eq.${phone},email.eq.${phone}`)
        .single();
      
      console.log('📊 نتيجة البحث:', { user, error });
      
      if (error || !user) {
        console.log('❌ المستخدم غير موجود');
        return { success: false, error: 'رقم الهاتف أو كلمة المرور غير صحيحة' };
      }
      
      // التحقق من كلمة المرور
      const encodedPassword = btoa(password);
      console.log('🔐 مقارنة كلمة المرور:');
      console.log('   - المدخلة (مشفرة):', encodedPassword);
      console.log('   - المحفوظة:', user.password);
      
      if (user.password !== encodedPassword) {
        console.log('❌ كلمة المرور غير صحيحة');
        return { success: false, error: 'رقم الهاتف أو كلمة المرور غير صحيحة' };
      }
      
      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
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

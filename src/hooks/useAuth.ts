import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';

export interface User {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  studentPhone?: string;
  role: 'admin' | 'teacher' | 'student';
  image?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const userData = await authService.getMe();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (studentPhone: string, password: string) => {
    const response = await authService.login(studentPhone, password);
    const userWithToken = { ...response.user, token: response.token };
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(userWithToken));
    setUser(response.user);
    setIsAuthenticated(true);
    return response;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      router.replace('/login');
    }
  };

  const requireAuth = (redirectTo = '/login') => {
    if (!loading && !isAuthenticated) {
      router.replace(redirectTo);
      return false;
    }
    return true;
  };

  const requireRole = (roles: string[]) => {
    if (!user || !roles.includes(user.role)) {
      router.replace('/');
      return false;
    }
    return true;
  };

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
    requireAuth,
    requireRole,
  };
};

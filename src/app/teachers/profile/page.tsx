'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProfilePage from '@/app/profile/page';

export default function TeacherProfile() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (user && user.role !== 'teacher') {
      router.replace('/');
      return;
    }
  }, [user, isAuthenticated, router]);

  if (!isAuthenticated || (user && user.role !== 'teacher')) {
    return null;
  }

  return <ProfilePage />;
}

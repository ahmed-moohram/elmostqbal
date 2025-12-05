'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProfilePage from '@/app/profile/page';

export default function StudentProfile() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (user && user.role !== 'student') {
      router.replace('/');
      return;
    }
  }, [user, isAuthenticated, router]);

  if (!isAuthenticated || (user && user.role !== 'student')) {
    return null;
  }

  return <ProfilePage />;
}

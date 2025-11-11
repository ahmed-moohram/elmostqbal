'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import SettingsPage from '@/app/settings/page';

export default function StudentSettings() {
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

  return <SettingsPage />;
}

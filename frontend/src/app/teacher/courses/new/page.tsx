'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyTeacherNewCourseRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/teachers/courses/create');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600 text-lg">
        جاري تحويلك إلى صفحة إنشاء الكورس...
      </p>
    </div>
  );
}

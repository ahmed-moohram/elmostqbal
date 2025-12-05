/**
 * ملف تحسين التنقل بين الصفحات
 * يستخدم prefetching للصفحات المهمة لتحسين السرعة
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook لتحميل الصفحات المهمة مسبقاً
 */
export function usePrefetchImportantPages() {
  const router = useRouter();

  useEffect(() => {
    // تحميل الصفحات المهمة مسبقاً بعد تحميل الصفحة الحالية
    const prefetchTimer = setTimeout(() => {
      // الصفحات التي يتم زيارتها بشكل متكرر
      router.prefetch('/courses');
      router.prefetch('/library');
      router.prefetch('/dashboard');
      router.prefetch('/profile');
    }, 2000); // بعد ثانيتين من تحميل الصفحة

    return () => clearTimeout(prefetchTimer);
  }, [router]);
}

/**
 * تحسين التنقل باستخدام Intersection Observer
 */
export function usePrefetchOnHover(href: string) {
  const router = useRouter();
  
  const handleMouseEnter = () => {
    router.prefetch(href);
  };
  
  return { onMouseEnter: handleMouseEnter };
}

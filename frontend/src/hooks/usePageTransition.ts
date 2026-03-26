/**
 * Hook مخصص للتنقل الفوري بين الصفحات - بدون تأخير
 */
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function usePageTransition() {
  const pathname = usePathname();
  // تم إزالة التأخير للحصول على تنقل فوري
  return { isNavigating: false, pathname };
}

/**
 * Hook لتحميل الصفحات المهمة مسبقاً
 */
export function useSmartPrefetch() {
  useEffect(() => {
    // تحميل الموارد المهمة بعد تحميل الصفحة
    if (typeof window !== 'undefined') {
      const prefetchLinks = () => {
        const links = document.querySelectorAll('a[href^="/"]');
        links.forEach((link) => {
          const href = link.getAttribute('href');
          if (href && !href.startsWith('#')) {
            // إضافة prefetch للروابط عند hover
            link.addEventListener('mouseenter', () => {
              const linkEl = document.createElement('link');
              linkEl.rel = 'prefetch';
              linkEl.href = href;
              document.head.appendChild(linkEl);
            }, { once: true });
          }
        });
      };

      // تأخير التنفيذ لعدم التأثير على الأداء الأولي
      setTimeout(prefetchLinks, 3000);
    }
  }, []);
}

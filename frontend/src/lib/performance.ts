/**
 * مكتبة تحسين الأداء والتنقل الفوري
 */

/**
 * تحميل الصفحات المهمة مسبقاً
 */
export const prefetchImportantPages = (router: any) => {
  if (typeof window === 'undefined') return;
  
  // قائمة الصفحات المهمة للتحميل المسبق
  const importantPages = [
    '/courses',
    '/dashboard',
    '/library',
    '/profile',
  ];
  
  // تحميل الصفحات بشكل غير متزامن
  requestIdleCallback(() => {
    importantPages.forEach(page => {
      router.prefetch(page);
    });
  });
};

/**
 * تحسين أداء الصور
 */
export const optimizeImages = () => {
  if (typeof window === 'undefined') return;
  
  // تفعيل lazy loading للصور
  const images = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        img.src = img.dataset.src || '';
        img.removeAttribute('data-src');
        imageObserver.unobserve(img);
      }
    });
  });
  
  images.forEach(img => imageObserver.observe(img));
};

/**
 * تنظيف الذاكرة
 */
export const clearMemoryCache = () => {
  if (typeof window === 'undefined') return;
  
  // مسح الكاش القديم
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        if (name.startsWith('old-')) {
          caches.delete(name);
        }
      });
    });
  }
};

/**
 * تسريع التنقل باستخدام prefetch على hover
 */
export const enableHoverPrefetch = () => {
  if (typeof window === 'undefined') return;
  
  // إضافة prefetch عند hover على الروابط
  document.addEventListener('mouseover', (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a[href^="/"]');
    
    if (link && link instanceof HTMLAnchorElement) {
      const href = link.getAttribute('href');
      if (href && !link.dataset.prefetched) {
        const linkEl = document.createElement('link');
        linkEl.rel = 'prefetch';
        linkEl.href = href;
        document.head.appendChild(linkEl);
        link.dataset.prefetched = 'true';
      }
    }
  }, { passive: true });
};

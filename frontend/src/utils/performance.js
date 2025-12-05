/**
 * أدوات تحسين الأداء والتنقل السريع
 * Performance Optimization Utilities
 */

// ========================================
// 1. التحميل المسبق للصفحات (Prefetching)
// ========================================

class NavigationOptimizer {
  constructor() {
    this.prefetchedUrls = new Set();
    this.cache = new Map();
    this.observers = new Map();
    this.initPrefetching();
  }

  // تهيئة التحميل المسبق
  initPrefetching() {
    // مراقبة الروابط عند مرور الماوس
    document.addEventListener('mouseover', this.handleHover.bind(this), true);
    
    // مراقبة الروابط المرئية
    this.setupIntersectionObserver();
    
    // تحميل مسبق للصفحات الشائعة
    this.prefetchCommonPages();
  }

  // التحميل المسبق عند مرور الماوس
  handleHover(e) {
    const link = e.target.closest('a');
    if (link && link.href && !this.prefetchedUrls.has(link.href)) {
      this.prefetch(link.href);
    }
  }

  // التحميل المسبق للروابط المرئية
  setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const link = entry.target;
          if (link.href && !this.prefetchedUrls.has(link.href)) {
            this.prefetch(link.href, 'low');
          }
        }
      });
    }, {
      rootMargin: '50px'
    });

    // مراقبة جميع الروابط
    document.querySelectorAll('a[href]').forEach(link => {
      observer.observe(link);
    });
  }

  // تحميل مسبق للصفحات الشائعة
  prefetchCommonPages() {
    const commonPages = [
      '/courses',
      '/dashboard',
      '/profile',
      '/live-sessions'
    ];

    commonPages.forEach(url => {
      this.prefetch(url, 'low');
    });
  }

  // دالة التحميل المسبق
  prefetch(url, priority = 'high') {
    if (this.prefetchedUrls.has(url)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'document';
    
    if (priority === 'high') {
      link.importance = 'high';
    }

    document.head.appendChild(link);
    this.prefetchedUrls.add(url);
  }

  // تحميل الموارد بشكل استباقي
  preloadResources(resources) {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.url;
      link.as = resource.type;
      
      if (resource.type === 'font') {
        link.crossOrigin = 'anonymous';
      }
      
      document.head.appendChild(link);
    });
  }
}

// ========================================
// 2. التنقل الفوري (Instant Navigation)
// ========================================

class InstantNavigator {
  constructor() {
    this.transitioning = false;
    this.cache = new Map();
    this.setupInstantNavigation();
  }

  setupInstantNavigation() {
    // اعتراض النقرات على الروابط
    document.addEventListener('click', this.handleClick.bind(this), true);
    
    // التعامل مع أزرار المتصفح
    window.addEventListener('popstate', this.handlePopState.bind(this));
  }

  async handleClick(e) {
    const link = e.target.closest('a');
    
    if (!link || !this.shouldIntercept(link)) return;
    
    e.preventDefault();
    await this.navigate(link.href);
  }

  shouldIntercept(link) {
    // تحقق من الشروط
    return (
      link.href &&
      link.href.startsWith(window.location.origin) &&
      !link.hasAttribute('download') &&
      !link.hasAttribute('data-no-instant') &&
      link.target !== '_blank'
    );
  }

  async navigate(url, pushState = true) {
    if (this.transitioning) return;
    this.transitioning = true;

    try {
      // إظهار مؤشر التحميل الفوري
      this.showLoadingIndicator();

      // جلب الصفحة من الكاش أو الخادم
      const html = await this.fetchPage(url);
      
      // تحديث المحتوى بسلاسة
      await this.updateContent(html);
      
      // تحديث URL
      if (pushState) {
        history.pushState({ url }, '', url);
      }
      
      // تحديث العنوان
      this.updateTitle(html);
      
      // تشغيل السكريبتات
      this.executeScripts(html);
      
    } catch (error) {
      console.error('Navigation error:', error);
      // الانتقال العادي في حالة الخطأ
      window.location.href = url;
    } finally {
      this.transitioning = false;
      this.hideLoadingIndicator();
    }
  }

  async fetchPage(url) {
    // التحقق من الكاش أولاً
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    const response = await fetch(url, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    const html = await response.text();
    
    // حفظ في الكاش
    this.cache.set(url, html);
    
    // تنظيف الكاش القديم
    if (this.cache.size > 20) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    return html;
  }

  async updateContent(html) {
    const parser = new DOMParser();
    const newDoc = parser.parseFromString(html, 'text/html');
    
    const newContent = newDoc.querySelector('#app-content') || newDoc.body;
    const currentContent = document.querySelector('#app-content') || document.body;
    
    // تأثير الانتقال السلس
    currentContent.style.opacity = '0';
    currentContent.style.transform = 'translateY(10px)';
    
    await this.sleep(150);
    
    // استبدال المحتوى
    currentContent.innerHTML = newContent.innerHTML;
    
    // إظهار المحتوى الجديد
    currentContent.style.opacity = '1';
    currentContent.style.transform = 'translateY(0)';
  }

  updateTitle(html) {
    const match = html.match(/<title>(.*?)<\/title>/);
    if (match) {
      document.title = match[1];
    }
  }

  executeScripts(html) {
    const parser = new DOMParser();
    const newDoc = parser.parseFromString(html, 'text/html');
    const scripts = newDoc.querySelectorAll('script');
    
    scripts.forEach(script => {
      if (script.src) {
        // تحميل السكريبت الخارجي
        const newScript = document.createElement('script');
        newScript.src = script.src;
        newScript.async = true;
        document.body.appendChild(newScript);
      } else {
        // تنفيذ السكريبت المباشر
        eval(script.textContent);
      }
    });
  }

  handlePopState(e) {
    if (e.state && e.state.url) {
      this.navigate(e.state.url, false);
    }
  }

  showLoadingIndicator() {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) {
      indicator.style.display = 'block';
    }
  }

  hideLoadingIndicator() {
    const indicator = document.getElementById('loading-indicator');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ========================================
// 3. تحسين التحميل الكسول (Lazy Loading)
// ========================================

class LazyLoader {
  constructor() {
    this.setupLazyLoading();
  }

  setupLazyLoading() {
    // الصور
    this.lazyLoadImages();
    
    // الفيديوهات
    this.lazyLoadVideos();
    
    // المكونات
    this.lazyLoadComponents();
  }

  lazyLoadImages() {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          
          // تحميل الصورة
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          
          // تحميل srcset
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
            img.removeAttribute('data-srcset');
          }
          
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '100px'
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  lazyLoadVideos() {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const video = entry.target;
          
          if (video.dataset.src) {
            video.src = video.dataset.src;
            video.load();
            video.removeAttribute('data-src');
          }
          
          videoObserver.unobserve(video);
        }
      });
    }, {
      rootMargin: '200px'
    });

    document.querySelectorAll('video[data-src]').forEach(video => {
      videoObserver.observe(video);
    });
  }

  lazyLoadComponents() {
    const componentObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const component = entry.target;
          
          if (component.dataset.component) {
            this.loadComponent(component.dataset.component, component);
            componentObserver.unobserve(component);
          }
        }
      });
    });

    document.querySelectorAll('[data-component]').forEach(el => {
      componentObserver.observe(el);
    });
  }

  async loadComponent(componentName, container) {
    try {
      const module = await import(`/components/${componentName}.js`);
      module.default(container);
    } catch (error) {
      console.error(`Failed to load component ${componentName}:`, error);
    }
  }
}

// ========================================
// 4. تحسين الأداء العام
// ========================================

class PerformanceEnhancer {
  constructor() {
    this.setupOptimizations();
  }

  setupOptimizations() {
    // تأجيل التحميلات غير الضرورية
    this.deferNonCriticalResources();
    
    // تحسين الرسوميات
    this.optimizeAnimations();
    
    // تقليل إعادة الرسم
    this.minimizeReflows();
    
    // تحسين معالجة الأحداث
    this.optimizeEventHandlers();
  }

  deferNonCriticalResources() {
    // تأجيل CSS غير الحرج
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    stylesheets.forEach(link => {
      if (!link.hasAttribute('data-critical')) {
        link.media = 'print';
        link.onload = function() { this.media = 'all'; };
      }
    });

    // تأجيل JavaScript غير الحرج
    const scripts = document.querySelectorAll('script:not([async]):not([defer])');
    scripts.forEach(script => {
      if (!script.hasAttribute('data-critical')) {
        script.defer = true;
      }
    });
  }

  optimizeAnimations() {
    // استخدام will-change للعناصر المتحركة
    document.querySelectorAll('[data-animate]').forEach(el => {
      el.style.willChange = 'transform, opacity';
      
      // إزالة will-change بعد انتهاء الحركة
      el.addEventListener('animationend', () => {
        el.style.willChange = 'auto';
      });
    });

    // تعطيل الحركات للأجهزة الضعيفة
    if (this.isLowEndDevice()) {
      document.body.classList.add('reduce-motion');
    }
  }

  minimizeReflows() {
    // تجميع تغييرات DOM
    const fragment = document.createDocumentFragment();
    
    // استخدام requestAnimationFrame للتحديثات
    window.requestAnimationFrame(() => {
      // تطبيق التغييرات دفعة واحدة
      document.body.appendChild(fragment);
    });
  }

  optimizeEventHandlers() {
    // استخدام Event Delegation
    document.body.addEventListener('click', (e) => {
      const button = e.target.closest('button');
      if (button) {
        this.handleButtonClick(button);
      }
    });

    // Debounce للأحداث المتكررة
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      if (scrollTimeout) {
        window.cancelAnimationFrame(scrollTimeout);
      }
      
      scrollTimeout = window.requestAnimationFrame(() => {
        this.handleScroll();
      });
    }, { passive: true });
  }

  handleButtonClick(button) {
    // معالجة النقرات على الأزرار
    const action = button.dataset.action;
    if (action) {
      this.executeAction(action);
    }
  }

  handleScroll() {
    // معالجة التمرير
    const scrollY = window.scrollY;
    
    // إظهار/إخفاء زر العودة للأعلى
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
      backToTop.style.display = scrollY > 300 ? 'block' : 'none';
    }
  }

  executeAction(action) {
    // تنفيذ الإجراءات
    switch(action) {
      case 'navigate':
        // التنقل السريع
        break;
      case 'load-more':
        // تحميل المزيد
        break;
      default:
        break;
    }
  }

  isLowEndDevice() {
    // التحقق من قوة الجهاز
    return (
      navigator.hardwareConcurrency < 4 ||
      navigator.deviceMemory < 4 ||
      navigator.connection?.effectiveType === 'slow-2g' ||
      navigator.connection?.effectiveType === '2g'
    );
  }
}

// ========================================
// 5. Service Worker للكاش والأداء
// ========================================

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(registration => {
    console.log('Service Worker registered:', registration);
  }).catch(error => {
    console.error('Service Worker registration failed:', error);
  });
}

// ========================================
// التهيئة التلقائية
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  // تهيئة جميع المحسنات
  window.navigationOptimizer = new NavigationOptimizer();
  window.instantNavigator = new InstantNavigator();
  window.lazyLoader = new LazyLoader();
  window.performanceEnhancer = new PerformanceEnhancer();
  
  console.log('✅ Performance optimizations initialized');
});

// ========================================
// التصدير للاستخدام في React/Vue
// ========================================

export {
  NavigationOptimizer,
  InstantNavigator,
  LazyLoader,
  PerformanceEnhancer
};

/**
 * Service Worker للكاش المتقدم والأداء الفائق
 * Advanced Caching Service Worker
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `education-platform-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;

// الملفات الأساسية للكاش
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/app.css',
  '/js/app.js',
  '/manifest.json',
  '/offline.html'
];

// أنواع الملفات للكاش
const CACHEABLE_TYPES = [
  'text/html',
  'text/css',
  'text/javascript',
  'application/javascript',
  'application/json',
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/webp',
  'font/woff2',
  'font/woff'
];

// ========================================
// التثبيت والتفعيل
// ========================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== DYNAMIC_CACHE)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// ========================================
// استراتيجيات الكاش
// ========================================

// Network First للـ API
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Cache First للأصول الثابتة
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // تحديث الكاش في الخلفية
    fetch(request).then(response => {
      if (response.ok) {
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, response);
        });
      }
    });
    
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return caches.match('/offline.html');
  }
}

// Stale While Revalidate
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      caches.open(DYNAMIC_CACHE).then(cache => {
        cache.put(request, response.clone());
      });
    }
    return response;
  });
  
  return cachedResponse || fetchPromise;
}

// ========================================
// معالجة الطلبات
// ========================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // تجاهل الطلبات الخارجية
  if (!url.origin.includes(self.location.origin)) {
    return;
  }
  
  // API Requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // الصور والملفات الثابتة
  if (request.destination === 'image' || 
      request.destination === 'font' ||
      request.destination === 'style') {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // HTML Pages
  if (request.mode === 'navigate') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  
  // باقي الطلبات
  event.respondWith(staleWhileRevalidate(request));
});

// ========================================
// Background Sync للطلبات الفاشلة
// ========================================

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-requests') {
    event.waitUntil(syncOfflineRequests());
  }
});

async function syncOfflineRequests() {
  const cache = await caches.open('offline-requests');
  const requests = await cache.keys();
  
  for (const request of requests) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.delete(request);
      }
    } catch (error) {
      console.error('[SW] Sync failed for:', request.url);
    }
  }
}

// ========================================
// Push Notifications
// ========================================

self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'إشعار جديد',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'عرض',
        icon: '/images/checkmark.png'
      },
      {
        action: 'close',
        title: 'إغلاق',
        icon: '/images/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('منصة التعليم', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    clients.openWindow('/notifications');
  } else if (event.action === 'close') {
    event.notification.close();
  } else {
    clients.openWindow('/');
  }
});

// ========================================
// تنظيف الكاش القديم
// ========================================

async function cleanupCache() {
  const cache = await caches.open(DYNAMIC_CACHE);
  const requests = await cache.keys();
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 أيام
  
  for (const request of requests) {
    const response = await cache.match(request);
    const dateHeader = response.headers.get('date');
    
    if (dateHeader) {
      const date = new Date(dateHeader);
      const age = Date.now() - date.getTime();
      
      if (age > maxAge) {
        await cache.delete(request);
      }
    }
  }
}

// تنظيف دوري كل 24 ساعة
setInterval(cleanupCache, 24 * 60 * 60 * 1000);

// ========================================
// معالجة الأخطاء
// ========================================

self.addEventListener('error', (event) => {
  console.error('[SW] Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled rejection:', event.reason);
});

console.log('[SW] Service Worker loaded successfully');

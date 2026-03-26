/**
 * Service Worker for PWA Support
 * تحسين الأداء والعمل Offline
 */

const CACHE_NAME = 'education-platform-v1';
const urlsToCache = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  // Add more static assets
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // API calls - Network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clone the response before caching
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(request, responseToCache);
            });
          
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets - Cache first, network fallback
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          // Update cache in background
          fetch(request)
            .then(freshResponse => {
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(request, freshResponse);
                });
            });
          
          return response;
        }

        return fetch(request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200) {
              return response;
            }

            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(request, responseToCache);
              });

            return response;
          });
      })
      .catch(() => {
        // Offline fallback
        if (request.destination === 'document') {
          return caches.match('/offline.html');
        }
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-enrollments') {
    event.waitUntil(syncEnrollments());
  }
});

async function syncEnrollments() {
  // Get pending enrollments from IndexedDB
  const pending = await getPendingEnrollments();
  
  for (const enrollment of pending) {
    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrollment)
      });
      
      if (response.ok) {
        await removePendingEnrollment(enrollment.id);
      }
    } catch (error) {
      console.error('Failed to sync enrollment:', error);
    }
  }
}

// Push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'لديك إشعار جديد',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'عرض',
        icon: '/check.png'
      },
      {
        action: 'close',
        title: 'إغلاق',
        icon: '/close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('منصة التعليم', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    clients.openWindow('/notifications');
  } else if (event.action === 'close') {
    event.notification.close();
  }
});

// Helper functions for IndexedDB
async function getPendingEnrollments() {
  // Implementation for getting pending enrollments from IndexedDB
  return [];
}

async function removePendingEnrollment(id) {
  // Implementation for removing pending enrollment from IndexedDB
}

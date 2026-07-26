/* ===========================================================
   Service Worker — مزرعة الحديدي للاستزراع السمكي
   Professional PWA Service Worker v3.0
   
   Features:
   - App Shell caching with version control
   - Network-first for Firebase / live data
   - Stale-while-revalidate for static assets
   - Offline fallback page
   - Background sync support
   - Cache cleanup on update
   =========================================================== */

const CACHE_VERSION = 'fish-farm-v3.0-pro';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const OFFLINE_PAGE = './offline.html';

/* ============ APP SHELL ============ */
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap'
];

/* ============ INSTALL EVENT ============ */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v3.0...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(APP_SHELL).catch(err => {
          console.warn('[SW] Some shell resources failed to cache:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

/* ============ ACTIVATE EVENT ============ */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v3.0...');
  
  event.waitUntil(
    caches.keys()
      .then(keys => {
        return Promise.all(
          keys
            .filter(key => key.startsWith('fish-farm-') && !key.includes(CACHE_VERSION))
            .map(key => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

/* ============ FETCH STRATEGY ============ */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip Firebase auth/API calls - always network
  if (isFirebaseRequest(url)) {
    return;
  }
  
  // Navigation requests - Network first, fallback to cache, then offline page
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }
  
  // Static assets (images, fonts, CSS) - Stale while revalidate
  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  
  // API calls - Network first with cache fallback
  if (isAPIRequest(url)) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Default: Cache first with network fallback
  event.respondWith(cacheFirst(request));
});

/* ============ FETCH STRATEGIES ============ */

async function handleNavigation(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    
    // Fallback to cached index or offline page
    const cachedIndex = await caches.match('./index.html');
    if (cachedIndex) return cachedIndex;
    
    // Return offline page if available
    const offlinePage = await caches.match(OFFLINE_PAGE);
    if (offlinePage) return offlinePage;
    
    // Final fallback
    return new Response(
      '<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>غير متصل</title>' +
      '<style>body{font-family:Cairo,sans-serif;display:flex;align-items:center;justify-content:center;' +
      'min-height:100vh;margin:0;background:#040d1a;color:#e8f4fc;text-align:center;padding:20px}' +
      '.offline-icon{font-size:80px;margin-bottom:20px}.offline-title{font-size:24px;font-weight:900;color:#00e5ff}' +
      '.offline-msg{color:#7aa2c4;margin-top:10px}.retry-btn{margin-top:24px;padding:14px 28px;' +
      'background:linear-gradient(135deg,#00b4d8,#00e5ff);border:none;border-radius:12px;color:#021020;' +
      'font-family:Cairo,sans-serif;font-weight:800;font-size:16px;cursor:pointer}</style></head>' +
      '<body><div><div class="offline-icon">🐟</div><div class="offline-title">أنت غير متصل بالإنترنت</div>' +
      '<div class="offline-msg">تحقق من اتصالك بالإنترنت وحاول مرة أخرى</div>' +
      '<button class="retry-btn" onclick="window.location.reload()">🔄 إعادة المحاولة</button></div></body></html>',
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({ 'Content-Type': 'text/html; charset=utf-8' })
      }
    );
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

async function networkFirst(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) return cachedResponse;
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) return cachedResponse;
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('', { status: 404 });
  }
}

/* ============ HELPER FUNCTIONS ============ */

function isFirebaseRequest(url) {
  return url.hostname.includes('firebase') ||
         url.hostname.includes('googleapis.com') ||
         url.hostname.includes('gstatic.com') ||
         url.pathname.includes('/identitytoolkit');
}

function isStaticAsset(url) {
  const staticExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.woff', '.woff2', '.ttf', '.eot', '.css'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext)) ||
         url.hostname.includes('fonts.googleapis.com') ||
         url.hostname.includes('fonts.gstatic.com');
}

function isAPIRequest(url) {
  return url.pathname.includes('/api/') ||
         url.pathname.includes('.json');
}

/* ============ MESSAGE HANDLER ============ */
self.addEventListener('message', (event) => {
  const { data } = event;
  
  if (data === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  
  if (data && data.type === 'SKIP_WAITING_AND_RELOAD') {
    self.skipWaiting().then(() => {
      event.source.postMessage({ type: 'RELOAD_NEEDED' });
    });
    return;
  }
  
  if (data && data.type === 'GET_VERSION') {
    event.source.postMessage({ type: 'VERSION', version: CACHE_VERSION });
    return;
  }
  
  if (data && data.type === 'CLEAR_CACHE') {
    caches.keys().then(keys => {
      keys.forEach(key => caches.delete(key));
    });
    return;
  }
});

/* ============ BACKGROUND SYNC ============ */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Sync pending operations when back online
  console.log('[SW] Syncing pending data...');
  // Implementation depends on app's IndexedDB/localStorage structure
}

/* ============ PUSH NOTIFICATIONS ============ */
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'تحديث جديد من مزرعة الحديدي',
    icon: './icon-192.png',
    badge: './icon-192.png',
    dir: 'rtl',
    lang: 'ar',
    vibrate: [200, 100, 200],
    tag: 'fish-farm-notification',
    renotify: true,
    actions: [
      { action: 'open', title: 'فتح التطبيق', icon: './icon-192.png' },
      { action: 'dismiss', title: 'إغلاق' }
    ],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('مزرعة الحديدي', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('./index.html')
    );
  }
});

/* ============ PERIODIC SYNC (Chrome/Edge) ============ */
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-updates') {
    event.waitUntil(checkForUpdates());
  }
});

async function checkForUpdates() {
  console.log('[SW] Checking for updates...');
  // Check for new data from server
}

console.log('[SW] Service Worker v3.0 loaded successfully');
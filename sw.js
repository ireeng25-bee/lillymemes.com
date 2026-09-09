/**
 * ============================================================================
 * LILLY MEMES — Progressive Web App Service Worker
 * Capabilities: Offline Asset Caching, Push Notifications, Background Sync
 * Deployment: Cloudflare Pages / Workers PWA Compatible
 * ============================================================================
 */

const CACHE_NAME = 'lilly-memes-v1.0.6';

// Core Application Shell Assets to Pre-cache
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './supabase.js',
  './manifest.json',
  './assets/appicon.png',
  './assets/icon.png',
  './assets/logo.png',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.8/dist/umd/supabase.min.js',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
];

// ============================================================================
// 1. INSTALL LIFECYCLE: PRE-CACHE STATIC ASSETS
// ============================================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch((err) => {
        console.warn('[SW] Cache installation warning:', err);
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ============================================================================
// 2. ACTIVATE LIFECYCLE: CLEAN STALE CACHES & CLAIM CLIENTS
// ============================================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache.startsWith('lilly-memes-') && cache !== CACHE_NAME) {
              return caches.delete(cache);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// ============================================================================
// 3. FETCH STRATEGY: STALE-WHILE-REVALIDATE / NETWORK-FIRST
// ============================================================================
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Bypass non-GET requests (e.g. POST uploads, DB mutations)
  if (request.method !== 'GET') {
    return;
  }

  // Bypass Supabase API queries & Auth calls (always fresh data)
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  // App Shell & Static Assets: Stale-While-Revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            // Cache valid HTTP 200 responses
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            // Offline fallback for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            return cachedResponse;
          });

        return cachedResponse || fetchPromise;
      });
    })
  );
});

// ============================================================================
// 4. REAL PUSH NOTIFICATION ARCHITECTURE (Rule 21)
// ============================================================================
self.addEventListener('push', (event) => {
  let notificationData = {
    title: '😂 New meme just dropped!',
    body: 'LILLY MEMES just posted something new. Come have a laugh! 🔥',
    icon: './assets/appicon.png',
    badge: './assets/appicon.png',
    data: {
      url: './'
    }
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      notificationData = {
        title: parsed.title || notificationData.title,
        body: parsed.body || notificationData.body,
        icon: parsed.icon || './assets/appicon.png',
        badge: parsed.badge || './assets/appicon.png',
        data: {
          url: parsed.url || parsed.link || './'
        }
      };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    data: notificationData.data,
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'View Meme 😂' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
  );
});

// ============================================================================
// 5. NOTIFICATION CLICK ROUTING (Deep link to meme or feed)
// ============================================================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) 
    ? event.notification.data.url 
    : './';
  const absoluteTargetUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Focus existing open window if available
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(absoluteTargetUrl);
            return client.focus();
          }
        }
        // Open new window if none is currently active
        if (clients.openWindow) {
          return clients.openWindow(absoluteTargetUrl);
        }
      })
  );
});
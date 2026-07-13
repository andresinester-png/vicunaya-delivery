const CACHE_NAME = 'vicunaya-shell-v1';
const SHELL_URLS = ['/', '/index.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for navigation, cache-first for assets
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response.ok && url.pathname.match(/\.(js|css|png|svg|jpg|webp|woff2?)$/)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return response;
      });
    })
  );
});

// Push notifications
self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data?.json() ?? {}; } catch (_) { data = { title: 'VicuñaYa', body: e.data?.text() }; }

  const title = data.title ?? 'VicuñaYa';
  const options = {
    body:    data.body ?? '',
    icon:    data.icon ?? '/icon-192.png',
    badge:   '/favicon-32.png',
    data:    { url: data.url ?? '/' },
    vibrate: [200, 100, 200],
  };

  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data?.url ?? '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
      const match = wins.find(w => w.url === url && 'focus' in w);
      if (match) return match.focus();
      return clients.openWindow(url);
    })
  );
});

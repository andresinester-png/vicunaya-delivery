// VicuñaYa Service Worker — handles push notifications

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};

  const title = data.title || '🛵 VicuñaYa';
  const options = {
    body:    data.body || 'Actualización de pedido',
    icon:    '/icon-192.png',
    badge:   '/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag:     data.tag || 'vicunaya-notification',
    renotify: true,
    data:    { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Ver' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/restaurant/panel/pedidos';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

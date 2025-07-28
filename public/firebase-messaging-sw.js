
// This file is intentionally left blank in this project.
// Firebase SDKs will be loaded and initialized automatically.
// You can add custom service worker logic here if needed.
self.addEventListener('push', event => {
  console.log('[Service Worker] Push Received.');
  
  if (!event.data) {
    console.error('[Service Worker] Push event but no data');
    return;
  }
  
  const pushData = event.data.json();
  console.log('[Service Worker] Push data:', pushData);

  const title = pushData.title || 'New Message';
  const options = {
    body: pushData.body || 'You received a new message.',
    icon: '/icon-192x192.png', // Make sure you have an icon in your public folder
    badge: '/badge-72x72.png', // And a badge icon
    data: {
      url: pushData.url || '/'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      // If a window for this app is already open, focus it.
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

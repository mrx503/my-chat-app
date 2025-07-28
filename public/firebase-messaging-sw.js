
// This service worker file is intentionally left empty.
// Firebase's messaging SDK will handle the push event logic automatically
// when the app is in the background. For foreground messages,
// the logic is handled within the main application code (WebPushProvider).

// We add a basic event listener to show it's installed.
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
});

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');
  
  if (!event.data) {
    console.error('[Service Worker] Push event but no data');
    return;
  }

  const data = event.data.json();
  console.log('[Service Worker] Push data:', data);

  const title = data.title || 'New Notification';
  const options = {
    body: data.body || 'Something new happened!',
    icon: '/duck-icon-192.png', // A default icon
    badge: '/duck-badge-72.png', // A badge for the notification bar
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});


self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: "window"
    }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

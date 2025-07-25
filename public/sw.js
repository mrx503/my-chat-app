// public/sw.js

self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  // Robust check for payload data
  const title = data?.title || 'New Message';
  const options = {
    body: data?.body || 'You have a new message.',
    icon: data?.icon || '/duck_logo.png', // Fallback to a default icon
    badge: '/duck_logo_mono.png', // A monochrome icon for the status bar
    vibrate: [200, 100, 200],
    tag: data?.tag || 'new-message', // Group notifications
    renotify: true,
    data: {
      url: data?.url || '/',
    },
    actions: [] // No buttons
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // If a window for the app is already open, focus it.
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

// A new monochrome logo for the notification badge
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('duck-cache').then((cache) => {
      return cache.addAll([
        '/duck_logo.png',
        '/duck_logo_mono.png'
      ]);
    })
  );
});


self.addEventListener('push', (event) => {
  const data = event.data.json();
  const { title, body, icon, tag, url } = data;

  const options = {
    body: body,
    icon: icon || '/duck_logo.png', // Fallback icon
    badge: '/duck_badge.png', // A monochrome badge for the status bar
    vibrate: [200, 100, 200, 100, 200, 100, 200], // Vibration pattern
    tag: tag, // Use chat ID to stack notifications
    renotify: true, // Vibrate and play sound for new notifications with the same tag
    actions: [], // Remove default "settings" button on some platforms
    data: {
      url: url, // URL to open on click
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if a window is already open and focused
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

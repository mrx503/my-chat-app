
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  const title = data.title || 'New Message';
  const options = {
    body: data.body,
    icon: 'https://i.postimg.cc/Gtp5B5Gh/file-00000000a07c620a8c42c26f1f499972.png', // The guaranteed working icon URL
    badge: 'https://i.postimg.cc/Gtp5B5Gh/file-00000000a07c620a8c42c26f1f499972.png', // Can also be used for the badge
    tag: data.tag, // This is crucial for grouping notifications
    vibrate: [200, 100, 200], // A simple vibration pattern
    data: {
      url: data.url // We keep the URL to navigate on click
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a window open with the same URL.
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

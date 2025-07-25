self.addEventListener('push', (event) => {
  const data = event.data.json();
  const title = data.title || 'New Message';
  
  const options = {
    body: data.body,
    icon: '/duck_logo.png', // Path to your logo in the public folder
    badge: '/duck_badge.png', // A smaller badge icon, often monochrome
    data: {
      url: data.url,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
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


self.addEventListener('push', (event) => {
  if (!event.data) {
    console.error('Push event but no data');
    return;
  }

  try {
    const data = event.data.json();
    const { title, body, url, icon } = data;
    const chatId = url.substring(url.lastIndexOf('/') + 1);

    const options = {
      body: body,
      icon: icon || '/duck_logo.png', // Fallback to app logo
      badge: '/duck_logo_mono.png', // Monochrome logo for the status bar
      tag: chatId, // Group notifications by chat
      renotify: true, // Re-notify if a new message arrives in the same chat
      data: {
        url: url, // URL to open on click
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (error) {
    console.error('Error parsing push data:', error);
    // Fallback notification if data parsing fails
    event.waitUntil(
      self.registration.showNotification('New Message', {
        body: 'You have a new message.',
        icon: '/duck_logo.png',
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a window open with the same URL.
      for (const client of clientList) {
        // Use client.url and check if it ends with the desired path
        const clientPath = new URL(client.url).pathname;
        if (clientPath === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is found, open a new one.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('install', (event) => {
  self.skipWaiting();
});


// Force new service worker to activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) {
    console.error('Push event but no data');
    return;
  }
  const data = event.data.json();
  const iconUrl = 'https://i.postimg.cc/Gtp5B5Gh/file-00000000a07c620a8c42c26f1f499972.png';

  const options = {
    body: data.body,
    icon: iconUrl,
    badge: iconUrl,
    vibrate: [200, 100, 200], // A simple vibration pattern
    tag: data.tag, // Use the chat ID to group notifications
    data: {
        url: data.url // URL to open on click
    },
    actions: [] // Ensure no default buttons are shown
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList.find(c => c.url.endsWith(urlToOpen) && 'focus' in c);
        if (client) {
            return client.focus();
        }
        // If no specific chat window is open, focus the main window
        if (clientList[0].url === '/' && 'focus' in clientList[0]) {
             return clientList[0].navigate(urlToOpen).then(c => c.focus());
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});

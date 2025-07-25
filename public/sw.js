self.addEventListener('push', (event) => {
  const data = event.data.json();

  const options = {
    body: data.body,
    icon: '/duck_logo.png', // The path to the icon
    badge: '/duck_logo.png', // A badge icon for the status bar
    vibrate: [200, 100, 200],
    data: {
      url: data.url,
    },
    actions: [], // An empty actions array removes default buttons
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus().then(client => client.navigate(urlToOpen));
      }
      return clients.openWindow(urlToOpen);
    })
  );
});

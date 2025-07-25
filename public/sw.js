self.addEventListener('push', (event) => {
    const data = event.data.json();
    const { title, body, icon, tag, url } = data;

    const options = {
        body: body,
        icon: '/duck_logo.png', // Fallback icon
        badge: '/duck_logo.png',
        vibrate: [200, 100, 200],
        tag: tag,
        data: {
            url: url
        },
        actions: []
    };
    
    // Use the provided icon if it's a valid URL, otherwise use fallback
    if (icon && icon.startsWith('http')) {
        options.icon = icon;
        options.badge = icon;
    }

    const promiseChain = self.registration.showNotification(title, options);
    event.waitUntil(promiseChain);
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data.url;
    
    const promiseChain = clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then((windowClients) => {
        let matchingClient = null;
        for (let i = 0; i < windowClients.length; i++) {
            const windowClient = windowClients[i];
            if (windowClient.url === urlToOpen) {
                matchingClient = windowClient;
                break;
            }
        }

        if (matchingClient) {
            return matchingClient.focus();
        } else {
            return clients.openWindow(urlToOpen);
        }
    });

    event.waitUntil(promiseChain);
});

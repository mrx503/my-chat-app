
// Service Worker for handling push notifications

self.addEventListener('push', function (event) {
    if (!event.data) {
        console.error('Push event but no data');
        return;
    }

    try {
        const data = event.data.json();

        const title = data.title || 'New Message';
        const options = {
            body: data.body,
            // The main icon of the notification. Should be the app logo.
            icon: '/duck_logo.png',
            // A smaller icon displayed on the notification. Used for sender's avatar.
            // Should be a URL to a monochrome image.
            badge: data.badge || '/duck_logo_mono.png',
            // A tag to group notifications. Messages from the same chat will be stacked.
            tag: data.tag || 'default-tag',
            // Makes the notification replace the previous one with the same tag.
            renotify: true,
            // Custom vibration pattern.
            vibrate: [200, 100, 200],
            // Data to be passed to the 'notificationclick' event.
            data: {
                url: data.url
            },
            // No default actions needed.
            actions: []
        };

        event.waitUntil(self.registration.showNotification(title, options));

    } catch (e) {
        console.error('Error parsing push data', e);
        const title = 'New Message';
        const options = {
            body: 'You have a new message.',
            icon: '/duck_logo.png',
            badge: '/duck_logo_mono.png',
            tag: 'default-tag',
            renotify: true,
            vibrate: [200, 100, 200],
            data: {
                url: '/'
            },
            actions: []
        };
        event.waitUntil(self.registration.showNotification(title, options));
    }
});


self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    const urlToOpen = event.notification.data.url || '/';

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function(clientList) {
            // If a window for the app is already open, focus it.
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                // Check if the client's URL is the one we want to navigate to.
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

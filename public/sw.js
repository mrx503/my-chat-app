
// This is the service worker file for handling push notifications.

self.addEventListener('push', (event) => {
    // Fallback data if the push event doesn't have data.
    const fallbackData = {
        title: 'New Message',
        body: 'You have a new message.',
        url: '/',
        tag: 'general'
    };
    
    let data;
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            console.error('Failed to parse push data:', e);
            data = fallbackData;
        }
    } else {
        data = fallbackData;
    }

    const title = data.title || fallbackData.title;
    const options = {
        body: data.body || fallbackData.body,
        // The icon MUST be a valid, fetchable URL. A local path is perfect.
        icon: '/duck_logo.png', 
        // A badge is a monochrome icon used in some UI contexts (e.g., Android status bar).
        badge: '/duck_logo.png', 
        // A tag is used to group notifications. New notifications with the same tag will replace old ones.
        tag: data.tag || fallbackData.tag,
        // The URL to open when the notification is clicked.
        data: {
            url: data.url || fallbackData.url,
        },
        // A vibration pattern for the notification.
        vibrate: [100, 50, 100],
        // Set renotify to true to make the device vibrate/play a sound for new notifications with the same tag.
        renotify: true,
        // We specify no actions to prevent browsers from adding default ones like "Settings".
        actions: []
    };

    event.waitUntil(self.registration.showNotification(title, options));
});


self.addEventListener('notificationclick', (event) => {
    // Close the notification when clicked.
    event.notification.close();

    const urlToOpen = event.notification.data.url || '/';

    // This looks for an existing window/tab with the same URL and focuses it.
    // If not found, it opens a new one.
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((clientList) => {
            // Check if there's already a window open with the target URL.
            for (const client of clientList) {
                // We use includes to handle cases where the URL might have extra params.
                if (client.url.includes(urlToOpen) && 'focus' in client) {
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

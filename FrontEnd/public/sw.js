self.addEventListener('push', function (event) {
    if (event.data) {
        try {
            const data = event.data.json();
            const options = {
                body: data.body,
                icon: '/gems-digitech-official-light.png',
                badge: '/gems-digitech-official-light.png',
                vibrate: [100, 50, 100],
                data: {
                    dateOfArrival: Date.now(),
                    primaryKey: '2'
                }
            };
            event.waitUntil(self.registration.showNotification(data.title || 'Digitech IMS', options));
        } catch (e) {
            const options = {
                body: event.data.text(),
                icon: '/gems-digitech-official-light.png'
            };
            event.waitUntil(self.registration.showNotification('Digitech IMS Notification', options));
        }
    }
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then(windowClients => {
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow('/');
            }
        })
    );
});

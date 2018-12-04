self.addEventListener('push', event => {
  const data = event.data.json();
  const { title, actions } = data;
  console.log('Got push', data);

  const options = {
    body: title,
    // icon: 'images/notification-flat.png',
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: actions
  };

  event.waitUntil(self.registration.showNotification(title, options));
});


// notifications
self.addEventListener('notificationclick', event => {
  // const notification = event.notification;
  // const primaryKey = notification.data.primaryKey;
  const [action, link] = event.action.split('-');

  switch (action) {
    case 'inquiry':
      clients.openWindow(link);
      break;
    default:
      break;
  }


});

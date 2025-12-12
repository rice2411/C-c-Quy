/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAQtMPqZE0A2XMM7bwikMW1EMlmDOdNip8",
  authDomain: "tiembanhcucquy-75fe1.firebaseapp.com",
  projectId: "tiembanhcucquy-75fe1",
  messagingSenderId: "744823161157",
  appId: "1:744823161157:web:695e5dbe4cca0de719fe2c"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon, click_action } = payload.notification;

  const notificationOptions = {
    body: body,
    icon: icon || "/icon.png",
    badge: "/icon.png",        // hiển thị kiểu native nếu cần
    vibrate: [200, 100, 200],   // cho cảm giác native trên mobile
    data: {
      url: click_action || "/", // dùng để mở khi click
    }
  };

  self.registration.showNotification(title, notificationOptions);
});

// Xử lý click để giống native behavior
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

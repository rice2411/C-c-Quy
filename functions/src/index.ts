// Import the Firebase modules
import * as admin from "firebase-admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Firestore trigger for new orders
export const notifyNewOrder = onDocumentCreated(
  {
    document: "orders/{orderId}",
    region: "us-central1", // Region mặc định, ổn định hơn
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  async (event) => {
    const order = event.data?.data();

    if (!order) return null; // safety check

    // Get all FCM tokens
    const tokensSnapshot = await db.collection("fcmTokens").get();
    const tokens = tokensSnapshot.docs
      .map(doc => doc.data().token)
      .filter(token => !!token); // remove undefined/null tokens

    if (!tokens.length) return null;

    // Build notification message
    const message = {
      notification: {
        title: "Tiệm bánh Cúc Quy",
        body: `Có đơn hàng mới: ${order.orderNumber || "Không có số đơn"}`
      },
      webpush: {
        fcmOptions: { link: "https://cucquy.vercel.app/orders" }
      },
      tokens
    };

    // Send notification
    const messaging = admin.messaging();
    const response = await messaging.sendEachForMulticast({
      notification: message.notification,
      webpush: message.webpush,
      tokens: message.tokens
    });
    console.log("Notifications sent:", response.successCount);
    if (response.failureCount > 0) {
      console.error("Failures:", response.responses.filter(r => !r.success));
    }

    return null;
  }
);

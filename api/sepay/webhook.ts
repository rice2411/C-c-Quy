/**
 * SePay Webhook API
 * POST /api/sepay/webhook
 *
 * Job duy nhất của webhook:
 *   1. Lưu transaction vào collection `transactions`.
 *   2. Mark order tương ứng paymentStatus = PAID + lưu sepayId.
 *
 * KHÔNG ghi history nữa — phần "Lịch sử nhận tiền" trong OrderDetail
 * được derive ở client bằng cách query `transactions where orderNumber == ...`.
 */

interface ApiRequest {
  method?: string;
  body?: any;
}

interface ApiResponse {
  status: (code: number) => { json: (data: any) => void };
  json: (data: any) => void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookData = req.body;

    // Validate
    if (!webhookData || !webhookData.id) {
      return res.status(400).json({ error: 'Invalid webhook data' });
    }

    // Import trực tiếp để tránh lỗi đường dẫn trên Vercel
    const firebaseApp = await import('firebase/app');
    const firebaseFirestore = await import('firebase/firestore');

    const firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      measurementId: process.env.FIREBASE_MEASUREMENT_ID,
    };

    let app;
    try {
      app = firebaseApp.getApp();
    } catch {
      app = firebaseApp.initializeApp(firebaseConfig);
    }

    const db = firebaseFirestore.getFirestore(app);
    const { collection, addDoc, Timestamp, doc, updateDoc, query, where, getDocs } = firebaseFirestore;

    const extractFormattedOrderCode = (str: string) => {
      const match = str.match(/ORD\d+/);
      return match ? match[0].replace(/ORD(\d+)/, 'ORD-$1') : null;
    };

    const orderNumber = extractFormattedOrderCode(webhookData.description);

    // 1. Lưu transaction
    const transactionData = {
      sepayId: webhookData.id,
      gateway: webhookData.gateway || '',
      transactionDate: webhookData.transactionDate || '',
      accountNumber: webhookData.accountNumber || '',
      code: webhookData.code || null,
      content: webhookData.content || '',
      transferType: webhookData.transferType || 'in',
      transferAmount: Number(webhookData.transferAmount) || 0,
      accumulated: Number(webhookData.accumulated) || 0,
      subAccount: webhookData.subAccount || null,
      referenceCode: webhookData.referenceCode || '',
      description: webhookData.description || '',
      receivedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      orderNumber,
    };
    await addDoc(collection(db, 'transactions'), transactionData);

    // 2. Update order paymentStatus = PAID
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('orderNumber', '==', orderNumber));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Không tìm thấy order — transaction đã lưu, trả 200 để SePay không retry
      return res.status(200).json({
        success: true,
        message: 'Transaction saved but no matching order',
        transactionId: webhookData.id,
      });
    }

    const docSnap = snapshot.docs[0];
    const orderRef = doc(db, 'orders', docSnap.id);

    await updateDoc(orderRef, {
      paymentStatus: 'PAID',
      sepayId: webhookData.id,
      updatedAt: Timestamp.now(),
    });

    return res.status(200).json({
      success: true,
      message: 'Webhook received',
      transactionId: webhookData.id,
    });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

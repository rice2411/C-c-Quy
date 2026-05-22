/**
 * SePay Webhook API
 * POST /api/sepay/webhook
 *
 * Self-contained — KHÔNG value-import file relative ngoài `api/` (Vercel ESM
 * resolution không kéo file ngoài function root → ERR_MODULE_NOT_FOUND /
 * FUNCTION_INVOCATION_FAILED).
 * Chỉ dùng:
 *   - Bare specifier (firebase/app, firebase/firestore) → Vercel auto-bundle.
 *   - Type-only import → TS erase ở compile time.
 */
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  Firestore,
  Timestamp,
  addDoc,
  collection,
  doc,
  getDocs,
  initializeFirestore,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { ApiRequest, ApiResponse } from '../../types/api';
import type { PaymentStatus } from '../../types/enums';

// Firestore init inline
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.FIREBASE_APP_ID || '',
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || '',
};
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db: Firestore = initializeFirestore(app, { experimentalForceLongPolling: true });

// Trích mã đơn dạng ORD-XXXXXX từ chuỗi tự do.
const extractFormattedOrderCode = (str: string | null | undefined): string | null => {
  const match = (str || '').match(/ORD\d+/);
  return match ? match[0].replace(/ORD(\d+)/, 'ORD-$1') : null;
};

// PaymentStatus.PAID literal — must duplicate value here vì runtime enum import không khả dụng.
const PAYMENT_STATUS_PAID: PaymentStatus = 'PAID' as PaymentStatus;

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookData = req.body;
    if (!webhookData || !webhookData.id) {
      return res.status(400).json({ error: 'Invalid webhook data' });
    }

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
      return res.status(200).json({
        success: true,
        message: 'Transaction saved but no matching order',
        transactionId: webhookData.id,
      });
    }

    const docSnap = snapshot.docs[0];
    const orderRef = doc(db, 'orders', docSnap.id);

    await updateDoc(orderRef, {
      paymentStatus: PAYMENT_STATUS_PAID,
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

/**
 * SePay Webhook API
 * POST /api/sepay/webhook
 *
 * Vercel serverless function. Firestore client init dùng chung từ
 * `../_lib/firebase`.
 */

import { db } from '../_lib/firebase';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

interface ApiRequest {
  method?: string;
  body?: any;
}

interface ApiResponse {
  status: (code: number) => { json: (data: any) => void };
  json: (data: any) => void;
}

const extractFormattedOrderCode = (str: string | null | undefined): string | null => {
  if (!str) return null;
  const match = String(str).match(/ORD\d+/);
  return match ? match[0].replace(/ORD(\d+)/, 'ORD-$1') : null;
};

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

    // 1. Log giao dịch SePay
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
    const transactionsRef = collection(db, 'transactions');
    await addDoc(transactionsRef, transactionData);

    // 2. Tìm order tương ứng theo orderNumber và set paymentStatus = PAID
    if (!orderNumber) {
      return res.status(200).json({
        success: true,
        message: 'Transaction logged but no orderNumber extracted from description',
        transactionId: webhookData.id,
      });
    }

    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('orderNumber', '==', orderNumber));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Không throw — đơn có thể chưa tạo, vẫn coi như success cho SePay.
      return res.status(200).json({
        success: true,
        message: `Transaction logged but order "${orderNumber}" not found`,
        transactionId: webhookData.id,
      });
    }

    const docSnap = snapshot.docs[0];
    const orderRef = doc(db, 'orders', docSnap.id);
    await updateDoc(orderRef, {
      paymentStatus: 'PAID',
      sepayId: webhookData.id,
    });

    return res.status(200).json({
      success: true,
      message: 'Webhook received',
      transactionId: webhookData.id,
      orderNumber,
    });
  } catch (error: any) {
    console.error('SePay webhook error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message ?? String(error),
    });
  }
}

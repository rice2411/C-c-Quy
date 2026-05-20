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
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { PaymentStatus } from '../../types/enums';
import { extractFormattedOrderCode } from '../../utils/order/orderNumberUtil';
import type { ApiRequest, ApiResponse } from '../../types/api';

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
      paymentStatus: PaymentStatus.PAID,
      sepayId: webhookData.id,
      updatedAt: Timestamp.now(),
    });

    return res.status(200).json({
      success: true,
      message: 'Webhook received',
      transactionId: webhookData.id,
    });
  } catch (error: any) {
    console.error('[sepay/webhook] error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

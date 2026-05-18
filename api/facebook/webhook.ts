/**
 * Facebook / Fanpage inbox Webhook API
 * POST /api/facebook/webhook
 *
 * Vercel serverless function. Firestore client init dùng chung từ
 * `../_lib/firebase` — không init inline để tận dụng warm container.
 */

import { db } from '../_lib/firebase';
import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  Timestamp,
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

const COLLECTION = 'facebook_messages';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookData = req.body;

    const idNewMessage =
      typeof webhookData?.id_new_message === 'string'
        ? webhookData.id_new_message.trim()
        : '';

    if (!webhookData || !idNewMessage) {
      return res
        .status(400)
        .json({ error: 'Invalid webhook data: id_new_message is required' });
    }

    const messagesRef = collection(db, COLLECTION);
    const dupQuery = query(
      messagesRef,
      where('idNewMessage', '==', idNewMessage),
      limit(1),
    );
    const existing = await getDocs(dupQuery);

    if (!existing.empty) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        message: 'Message already stored',
        id_new_message: idNewMessage,
        docId: existing.docs[0].id,
      });
    }

    const sourceCreatedAt =
      webhookData.create_at != null && String(webhookData.create_at).trim() !== ''
        ? String(webhookData.create_at).trim()
        : null;

    const messageData = {
      idNewMessage,
      idPage: String(webhookData.id_page ?? ''),
      pageScopeId: String(webhookData.page_scopeid ?? ''),
      idConversion: String(webhookData.id_conversion ?? ''),
      idCongTy: Number(webhookData.idcongty) || 0,
      message: String(webhookData.message ?? ''),
      type: Number(webhookData.type) || 0,
      isPhone: Number(webhookData.is_phone) || 0,
      useWebhook: Number(webhookData.use_webhook) || 0,
      urlWebhook: String(webhookData.url_webhook ?? ''),
      appId: webhookData.app_id ?? null,
      pageName: String(webhookData.page_name ?? ''),
      customerName: String(webhookData.customer_name ?? ''),
      numberPhone: String(webhookData.number_phone ?? ''),
      countryCode: String(webhookData.country_code ?? ''),
      sentByShop: Number(webhookData.sent_by_shop) || 0,
      aiDisabled: Boolean(webhookData.ai_disabled),
      attachment: Array.isArray(webhookData.attachment) ? webhookData.attachment : [],
      content:
        webhookData.content && typeof webhookData.content === 'object'
          ? webhookData.content
          : { type: '', data: [] },
      sourceCreatedAt,
      receivedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(messagesRef, messageData);

    return res.status(200).json({
      success: true,
      duplicate: false,
      message: 'Webhook received',
      id_new_message: idNewMessage,
      docId: docRef.id,
    });
  } catch (error: any) {
    console.error('Facebook webhook error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message ?? String(error),
    });
  }
}

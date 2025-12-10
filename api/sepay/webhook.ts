/**
 * SePay Webhook API
 * POST /api/sepay/webhook
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

    // Lưu vào Firebase
    // Import trực tiếp để tránh lỗi đường dẫn trên Vercel
    const firebaseApp = await import('firebase/app');
    const firebaseFirestore = await import('firebase/firestore');
    
    // Khởi tạo Firebase trực tiếp trong webhook (vì import tương đối không hoạt động trên Vercel)
    const firebaseConfig = {
      apiKey: "AIzaSyAQtMPqZE0A2XMM7bwikMW1EMlmDOdNip8",
      authDomain: "tiembanhcucquy-75fe1.firebaseapp.com",
      projectId: "tiembanhcucquy-75fe1",
      storageBucket: "tiembanhcucquy-75fe1.firebasestorage.app",
      messagingSenderId: "744823161157",
      appId: "1:744823161157:web:695e5dbe4cca0de719fe2c",
      measurementId: "G-6202LFPC63"
    };
    
    // Khởi tạo Firebase app (chỉ khởi tạo nếu chưa có)
    let app;
    try {
      app = firebaseApp.getApp();
    } catch {
      app = firebaseApp.initializeApp(firebaseConfig);
    }
    
    const db = firebaseFirestore.getFirestore(app);
    const { collection, addDoc, Timestamp } = firebaseFirestore;

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
    };

    const transactionsRef = collection(db, 'transaction');
    await addDoc(transactionsRef, transactionData);

    console.log('✅ Webhook saved:', webhookData.id);

    return res.status(200).json({
      success: true,
      message: 'Webhook received',
      transactionId: webhookData.id,
    });
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

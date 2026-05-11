import { GoogleGenAI } from "@google/genai";
import { Order } from '@/types';
import type { StockReceiptStructured } from '@/types/billReceipt';

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set in the environment.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateOrderAnalysis = async (order: Order, promptType: 'email' | 'risk' | 'summary', language: 'en' | 'vi' = 'en'): Promise<string> => {
  const ai = getClient();
  const errorMsg = language === 'vi' ? "Thiếu API Key. Không thể phân tích." : "API Key missing. Unable to generate analysis.";
  if (!ai) return errorMsg;

  let prompt = "";
  const orderDetails = JSON.stringify(order, null, 2);

  if (language === 'vi') {
      switch (promptType) {
        case 'email':
          prompt = `Bạn là chuyên gia chăm sóc khách hàng. Hãy viết một email chuyên nghiệp, lịch sự gửi tới khách hàng về đơn hàng của họ bằng tiếng Việt.
          Nếu trạng thái là DELIVERED, hãy cảm ơn họ.
          Nếu SHIPPED, cung cấp thông tin theo dõi.
          Nếu DELAYED hoặc PENDING trong thời gian dài, hãy xin lỗi một cách chân thành.

          Chi tiết đơn hàng:
          ${orderDetails}`;
          break;
        case 'risk':
          prompt = `Phân tích đơn hàng sau đây để tìm rủi ro gian lận tiềm ẩn hoặc các vấn đề thực hiện bằng tiếng Việt.
          Xem xét giá trị đơn hàng, loại mặt hàng và địa chỉ.
          Trả về điểm đánh giá rủi ro ngắn gọn (Thấp/Trung bình/Cao) và giải thích trong 2 câu.

          Chi tiết đơn hàng:
          ${orderDetails}`;
          break;
        case 'summary':
          prompt = `Tóm tắt đơn hàng này bằng 3 gạch đầu dòng cho đội ngũ vận hành bằng tiếng Việt. Làm nổi bật các mặt hàng giá trị cao hoặc các yêu cầu xử lý đặc biệt nếu thấy rõ.

          Chi tiết đơn hàng:
          ${orderDetails}`;
          break;
      }
  } else {
      switch (promptType) {
        case 'email':
          prompt = `You are a customer service expert. Write a professional, empathetic email to the customer regarding their order.
          If the status is DELIVERED, thank them.
          If SHIPPED, provide tracking info.
          If DELAYED or PENDING for a long time, apologize.

          Order Details:
          ${orderDetails}`;
          break;
        case 'risk':
          prompt = `Analyze the following order for potential fraud risk or fulfillment issues.
          Consider the order value, item types, and address.
          Return a brief risk assessment score (Low/Medium/High) and a 2-sentence explanation.

          Order Details:
          ${orderDetails}`;
          break;
        case 'summary':
          prompt = `Summarize this order in 3 bullet points for the fulfillment team. Highlight high-value items or special handling needs if apparent.

          Order Details:
          ${orderDetails}`;
          break;
      }
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2-flash',
      contents: prompt,
    });
    const defaultError = language === 'vi' ? "Không có phản hồi." : "No response generated.";
    return response.text || defaultError;
  } catch (error) {
    console.error("Gemini API Error:", error);
    const failError = language === 'vi' ? "Không thể tạo nội dung. Vui lòng thử lại." : "Failed to generate content. Please try again.";
    return failError;
  }
};

export const generateDashboardInsights = async (orders: Order[], language: 'en' | 'vi' = 'en'): Promise<string> => {
  const ai = getClient();
  const errorMsg = language === 'vi' ? "Thiếu API Key." : "API Key missing.";
  if (!ai) return errorMsg;

  const summaryData = orders.map(o => ({
    status: o.status,
    total: o.total,
    date: o.date,
    items: o.items.length
  }));

  const dataStr = JSON.stringify(summaryData);
  let prompt = "";

  if (language === 'vi') {
    prompt = `Bạn là một nhà phân tích kinh doanh. Phân tích các đơn hàng gần đây và cung cấp một bản tóm tắt ngắn gọn hàng ngày bằng tiếng Việt.
    1. Xác định bất kỳ xu hướng nào (ví dụ: lượng hủy đơn cao, doanh thu tăng đột biến).
    2. Đề xuất một bước hành động cụ thể cho người quản lý vận hành.
    3. Giữ độ dài dưới 150 từ.

    Dữ liệu: ${dataStr}`;
  } else {
    prompt = `You are a business analyst. specific Analyze these recent orders and provide a brief daily briefing.
    1. Identify any trends (e.g. high volume of cancellations, surge in revenue).
    2. Suggest one actionable step for the operations manager.
    3. Keep it under 150 words.

    Data: ${dataStr}`;
  }

  try {
     const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const defaultError = language === 'vi' ? "Không có thông tin chi tiết." : "No insights available.";
    return response.text || defaultError;
  } catch (error) {
    console.error("Gemini Dashboard Error:", error);
    const failError = language === 'vi' ? "Không thể tạo thông tin chi tiết lúc này." : "Unable to generate insights at this time.";
    return failError;
  }
}

function parseValidationJson(raw: string): {
  isLikelyReceipt: boolean;
  confidence: number;
  reasonVi: string;
} {
  let s = raw.trim();
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  if (fence) s = fence[1].trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(s) as Record<string, unknown>;
  } catch {
    throw new Error('Gemini trả lời kiểm tra bill không phải JSON hợp lệ. Thử lại.');
  }
  const isLikelyReceipt = Boolean(parsed.isLikelyReceipt ?? parsed.isLikelyPurchaseReceipt);
  const confidence = typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0;
  const reasonVi = typeof parsed.reasonVi === 'string' ? parsed.reasonVi : String(parsed.reason ?? '');
  return { isLikelyReceipt, confidence, reasonVi };
}

function parseStructuredJson(raw: string): StockReceiptStructured {
  let s = raw.trim();
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  if (fence) s = fence[1].trim();

  const parsed = JSON.parse(s) as Partial<StockReceiptStructured>;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Gemini không trả về object JSON hợp lệ.');
  }
  if (!Array.isArray(parsed.lineItems)) parsed.lineItems = [];

  const normalizeStr = (v: unknown): string | null => {
    if (typeof v !== 'string') return null;
    const trimmed = v.trim();
    return trimmed ? trimmed : null;
  };

  parsed.supplierPhone = normalizeStr(parsed.supplierPhone);
  parsed.supplierAddress = normalizeStr(parsed.supplierAddress);
  parsed.invoiceNumber = normalizeStr(parsed.invoiceNumber);

  if (parsed.supplierPhone) {
    const onlyDigitsPlus = parsed.supplierPhone.replace(/[\s.\-()]/g, '');
    parsed.supplierPhone = /^\+?\d{8,15}$/.test(onlyDigitsPlus)
      ? onlyDigitsPlus
      : parsed.supplierPhone;
  }

  return parsed as StockReceiptStructured;
}

export async function validateReceiptWithGemini(ocrText: string): Promise<{
  isLikelyReceipt: boolean;
  confidence: number;
  reasonVi: string;
}> {
  const ai = getClient();
  if (!ai) throw new Error('Thiếu GEMINI_API_KEY trong môi trường.');

  const snippet = ocrText.slice(0, 8000);
  const prompt = `Bạn kiểm tra nội dung OCR có phải chứng từ MUA HÀNG / BÁN HÀNG (hoá đơn, phiếu tính tiền, biên lai siêu thị, phiếu NCC, phiếu bán lẻ của shop…) hay không.

Trả về DUY NHẤT JSON (không markdown):
{"isLikelyReceipt": boolean, "confidence": number từ 0 đến 1, "reasonVi": string ngắn (tối đa 2 câu, tiếng Việt)}

HỢP LỆ — confidence >= 0.6, kể cả khi ảnh bị cắt mất phần dưới hoặc thiếu tổng tiền:
- Có TIÊU ĐỀ tiêu biểu: "HÓA ĐƠN BÁN HÀNG", "HÓA ĐƠN GTGT", "HOÁ ĐƠN", "Phiếu tính tiền", "Phiếu thu", "Biên lai", "Receipt", "Invoice".
- HOẶC có >= 1 mặt hàng + giá / số lượng (cột SL, ĐG, Thành tiền, Đơn giá…).
- HOẶC có cụm "Khách phải trả", "Tổng tiền hàng", "Tổng cộng", "Ngày bán", "Ngày lập".
- Phiếu nhỏ của shop tự in (chỉ vài dòng) VẪN hợp lệ — đừng đòi đầy đủ trường.

KHÔNG HỢP LỆ — confidence < 0.3:
- Ảnh chân dung / selfie / phong cảnh / sản phẩm rời.
- Menu nhà hàng / catalogue không có giá.
- Screenshot chat, bài báo, danh thiếp, slide, meme.
- Màn hình app không liên quan thanh toán.

Khi không chắc nhưng có dấu hiệu giống bill (chữ số tiền + tên sản phẩm) → confidence ~ 0.5–0.6, isLikelyReceipt = true, không reject vội.

OCR:
"""
${snippet}
"""`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  const text = response.text?.trim();
  if (!text) throw new Error('Gemini không trả lời khi kiểm tra bill.');
  return parseValidationJson(text);
}

const STRUCTURE_PROMPT_VI = `Bạn là trợ lý kế toán kho. Nhiệm vụ: làm sạch và cấu trúc hoá dữ liệu từ chữ đã OCR của một hoá đơn/phiếu mua hàng (nhập hàng).

Quy tắc chung:
- Trả về DUY NHẤT một JSON hợp lệ, không markdown, không giải thích.
- Số tiền: số thuần (number), không chuỗi. Không chắc thì null.
- Ngày: ưu tiên yyyy-mm-dd; nếu chỉ có dd/mm/yyyy hãy chuyển sang yyyy-mm-dd; không đoán bừa thì null.
- productLineCount = số dòng mặt hàng (sản phẩm) bạn trích được.
- currency: mặc định "VND" nếu bill VN.
- lineItems: mỗi phần tử có name (bắt buộc), quantity, unit (kg, thùng, chai...), unitPrice, lineTotal.

QUY TẮC TRÍCH XUẤT THÔNG TIN NCC (BẮT BUỘC CỐ GẮNG):

1) supplierPhone — số điện thoại của NCC / cửa hàng (không phải SĐT khách).
   - Bắt sau các nhãn: "ĐT", "Đ.T", "SĐT", "Điện thoại", "Tel", "Tel.", "Phone",
     "Hotline", "Liên hệ", "DT", "MB" (di động), "Mobile", "Fax" (không lấy fax).
   - Pattern VN: bắt đầu 0|+84 + 9–10 chữ số. Có thể có dấu cách / chấm / gạch.
   - Chuẩn hoá: bỏ ký tự ".-() " để chỉ còn chữ số + dấu "+" đầu nếu có.
   - Nếu có nhiều SĐT, lấy SĐT đầu tiên ở phần header của bill.

2) supplierAddress — địa chỉ NCC (KHÁC với "storeOrBranch" là tên chi nhánh).
   - Bắt sau các nhãn: "Địa chỉ", "Đ/C", "ĐC", "Address", "Add", "Tại", "Trụ sở".
   - Lấy nguyên 1 dòng địa chỉ (gộp tối đa 2 dòng nếu có "Số nhà / đường" và "Phường/Quận/TP" tách dòng).
   - Bỏ chấm/dấu hai chấm sau nhãn.

3) invoiceNumber — mã / số hoá đơn (mã chứng từ).
   - Bắt sau các nhãn: "Số HĐ", "Số hoá đơn", "Hoá đơn số", "HĐGTGT", "Mã HĐ",
     "Số phiếu", "Phiếu số", "No.", "No:", "Number", "Mẫu số" (lấy phần "Ký hiệu" cùng số).
   - Có thể dạng: HD-12345, HĐ 00001234, 00012345, 2C24TPB/000123, B-2024-00045…
   - Giữ nguyên định dạng gốc, viết HOA chữ cái.
   - Nếu chỉ có ngày + thời gian mà không có số riêng, để null.

4) supplierName: lấy đoạn TÊN ngắn (công ty / siêu thị / cửa hàng) — KHÔNG đính kèm địa chỉ/SĐT.

5) storeOrBranch: dùng cho tên chi nhánh ("Chi nhánh Q.10", "CN Hà Đông"…) — KHÔNG dùng cho địa chỉ.

Schema JSON (bám sát các key sau):
{
  "supplierName": string | null,
  "supplierPhone": string | null,
  "supplierAddress": string | null,
  "invoiceNumber": string | null,
  "storeOrBranch": string | null,
  "receiptDate": string | null,
  "receiptTime": string | null,
  "lineItems": [{ "name": string, "quantity": number | null, "unit": string | null, "unitPrice": number | null, "lineTotal": number | null }],
  "productLineCount": number,
  "subtotal": number | null,
  "tax": number | null,
  "discount": number | null,
  "totalAmount": number | null,
  "currency": string,
  "paymentMethod": string | null,
  "notes": string | null
}

Nội dung OCR:
`;

export async function structureStockReceiptWithGemini(ocrText: string): Promise<StockReceiptStructured> {
  const ai = getClient();
  if (!ai) throw new Error('Thiếu GEMINI_API_KEY trong môi trường.');

  const prompt = `${STRUCTURE_PROMPT_VI}
"""
${ocrText.slice(0, 12000)}
"""`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  const text = response.text?.trim();
  if (!text) throw new Error('Gemini không trả lời nội dung.');
  return parseStructuredJson(text);
}

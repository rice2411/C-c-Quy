import type { BillValidationResult, StockReceiptStructured } from '@/types/billReceipt';
import { validateReceiptWithGemini, structureStockReceiptWithGemini } from '@/services/geminiService';
import { extractTextWithVision } from '@/services/ocrService';

/** Các bước hiển thị tiến trình cho UI. */
export type BillImportProgressStage = 'vision' | 'validate' | 'structure';

/** Ngưỡng tối thiểu: Gemini đánh giá đây là bill và độ tin cậy đủ cao. */
const MIN_LLM_CONFIDENCE = 0.42;

const RECEIPT_KEYWORDS_VI = [
  'hóa đơn',
  'hoá đơn',
  'hđgtgt',
  'hđ',
  'vat',
  'mst',
  'mã số thuế',
  'tổng cộng',
  'tổng tiền',
  'thành tiền',
  'cộng tiền',
  'phiếu',
  'biên lai',
  'siêu thị',
  'công ty',
  'tnhh',
  'địa chỉ',
  'sđt',
  'điện thoại',
  'nhập hàng',
  'mua hàng',
  'giảm giá',
  'chiết khấu',
  'thanh toán',
  'tiền mặt',
  'chuyển khoản',
  'pos',
  'cashier',
];

const RECEIPT_KEYWORDS_EN = [
  'invoice',
  'receipt',
  'total',
  'tax',
  'subtotal',
  'amount',
  'bill to',
  'thank you',
  'payment',
];

/**
 * Heuristic nhanh: không thay LLM nhưng loại bớt ảnh quá lệch (menu, chữ quảng cáo…).
 */
export function quickReceiptHeuristic(ocrText: string): {
  score: number;
  noteVi: string;
  hardReject: boolean;
} {
  const text = ocrText.trim();
  if (text.length < 28) {
    return {
      score: 0,
      noteVi: 'Quá ít chữ sau OCR — thường bill có nhiều dòng hơn, hoặc ảnh quá mờ.',
      hardReject: true,
    };
  }
  if (!/\d/.test(text)) {
    return {
      score: 0.05,
      noteVi: 'Không thấy chữ số (giá, SL, mã…) — bill mua hàng hầu như luôn có số.',
      hardReject: true,
    };
  }

  const lower = text.toLowerCase();
  let hits = 0;
  for (const w of RECEIPT_KEYWORDS_VI) {
    if (lower.includes(w)) hits += 1;
  }
  for (const w of RECEIPT_KEYWORDS_EN) {
    if (lower.includes(w)) hits += 1;
  }

  const moneyLike =
    /\b\d{1,3}([.,]\d{3})+\b/.test(text) ||
    /\d+\s*[.,]\s*\d{3}\b/.test(text) ||
    /vnd|đồng|vnđ|dong/i.test(text) ||
    /\d{4,}/.test(text);

  let score = 0.25 + Math.min(0.45, hits * 0.06);
  if (moneyLike) score += 0.15;
  score = Math.min(1, score);

  const noteVi =
    hits < 2 && !moneyLike
      ? 'Ít từ khoá đặc trưng hoá đơn; vẫn có thể là bill — sẽ kiểm tra thêm bằng AI.'
      : 'Có dấu hiệu giống chứng từ mua hàng (từ khoá / số tiền).';

  return { score, noteVi, hardReject: false };
}


export async function runBillImportPipeline(
  imageBase64NoPrefix: string,
  options?: { onProgress?: (stage: BillImportProgressStage) => void }
): Promise<{
  ocrText: string;
  structured: StockReceiptStructured;
  validation: BillValidationResult;
}> {
  const onProgress = options?.onProgress;

  onProgress?.('vision');
  const ocrText = await extractTextWithVision(imageBase64NoPrefix);
  if (!ocrText) {
    throw new Error('Không đọc được chữ từ ảnh. Thử ảnh rõ hơn hoặc đổi góc chụp.');
  }

  const heuristic = quickReceiptHeuristic(ocrText);
  if (heuristic.hardReject) {
    throw new Error(`Ảnh có vẻ không phải bill nhập hàng: ${heuristic.noteVi}`);
  }

  onProgress?.('validate');
  const llmCheck = await validateReceiptWithGemini(ocrText);
  if (!llmCheck.isLikelyReceipt || llmCheck.confidence < MIN_LLM_CONFIDENCE) {
    const pct = Math.round(llmCheck.confidence * 100);
    throw new Error(
      `Không xác định là bill hợp lệ (độ tin cậy ${pct}%). ${llmCheck.reasonVi || 'Thử ảnh rõ hơn hoặc toàn trang hoá đơn.'}`
    );
  }

  onProgress?.('structure');
  const structured = await structureStockReceiptWithGemini(ocrText);

  const validation: BillValidationResult = {
    isLikelyReceipt: llmCheck.isLikelyReceipt,
    confidence: llmCheck.confidence,
    reasonVi: llmCheck.reasonVi,
    heuristicScore: heuristic.score,
    heuristicNoteVi: heuristic.noteVi,
  };

  return { ocrText, structured, validation };
}

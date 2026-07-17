import type { BillValidationResult, BillLineItem, LineItemType, StockReceiptStructured } from '@/types/billReceipt';
import { apiClient } from '@/services/api/client';

/**
 * Chuẩn hoá field phân loại AI từ Gemini (itemType/confidence/suggestedUsefulMonths)
 * về field FE (itemType mặc định, aiSuggestedType, aiConfidence, usefulMonths, category).
 */
const normalizeLine = (raw: Record<string, unknown>): BillLineItem => {
  const rawType = raw.itemType;
  const itemType: LineItemType =
    rawType === 'asset' || rawType === 'opex' ? rawType : 'material';
  const suggested = raw.suggestedUsefulMonths;
  return {
    name: String(raw.name ?? ''),
    quantity: typeof raw.quantity === 'number' ? raw.quantity : null,
    unit: (raw.unit as string) ?? null,
    unitPrice: typeof raw.unitPrice === 'number' ? raw.unitPrice : null,
    lineTotal: typeof raw.lineTotal === 'number' ? raw.lineTotal : null,
    itemType,
    aiSuggestedType: itemType,
    aiConfidence: typeof raw.confidence === 'number' ? raw.confidence : null,
    usefulMonths: itemType === 'asset' ? (typeof suggested === 'number' ? suggested : 24) : null,
    category: (raw.category as string) ?? null,
  };
};

/** Các bước hiển thị tiến trình cho UI (đọc chữ → kiểm tra → cấu trúc → phân loại). */
export type BillImportProgressStage = 'vision' | 'validate' | 'structure' | 'classify';

/**
 * Pipeline OCR + Gemini + gating được gom hết về BE (POST /stock-receipts/process-bill).
 * FE chỉ gửi ảnh base64 thuần (không prefix data:image/...) và nhận kết quả đã
 * chuẩn hoá. `onProgress` vẫn được giữ để UI hiển thị các bước, dù toàn bộ xử lý
 * chạy server-side trong 1 request.
 */
export async function runBillImportPipeline(
  imageBase64NoPrefix: string,
  options?: { onProgress?: (stage: BillImportProgressStage) => void },
): Promise<{
  ocrText: string;
  structured: StockReceiptStructured;
  validation: BillValidationResult;
}> {
  const onProgress = options?.onProgress;
  onProgress?.('vision');

  // BE xử lý trong 1 request (OCR → validate → structure → phân loại AI). Không có
  // tiến trình phụ từ server nên mô phỏng các bước cho UI trong lúc chờ (~vài giây).
  const timers: ReturnType<typeof setTimeout>[] = [];
  timers.push(setTimeout(() => onProgress?.('validate'), 900));
  timers.push(setTimeout(() => onProgress?.('structure'), 2100));
  timers.push(setTimeout(() => onProgress?.('classify'), 3400));

  let data: unknown;
  try {
    // apiClient đã bóc envelope → data = { ocrText, structured, validation }.
    const res = await apiClient.post('/stock-receipts/process-bill', {
      imageBase64: imageBase64NoPrefix,
    });
    data = res.data;
  } finally {
    timers.forEach(clearTimeout);
  }

  onProgress?.('classify');

  const result = data as {
    ocrText: string;
    structured: StockReceiptStructured;
    validation: BillValidationResult;
  };
  const rawLines = Array.isArray(result.structured?.lineItems)
    ? (result.structured.lineItems as unknown as Record<string, unknown>[])
    : [];
  return {
    ...result,
    structured: { ...result.structured, lineItems: rawLines.map(normalizeLine) },
  };
}

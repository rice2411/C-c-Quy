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
    // JOB NỀN (tránh 520 qua Cloudflare Tunnel với request OCR dài):
    // 1) Upload ảnh → BE trả jobId NGAY (kết nối chỉ giữ ~lúc upload).
    const startRes = await apiClient.post(
      '/stock-receipts/process-bill/start',
      { imageBase64: imageBase64NoPrefix },
      { timeout: 30000 },
    );
    const jobId = (startRes.data as { jobId?: string })?.jobId;
    if (!jobId) throw new Error('Không tạo được tác vụ OCR bill.');

    // 2) Poll kết quả (mỗi 1.5s, tối đa ~150s). Mỗi poll nhẹ + nhanh nên không đụng
    //    trần 100s của Cloudflare như request đồng bộ cũ.
    const POLL_MS = 1500;
    const deadline = Date.now() + 150_000;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      const res = await apiClient.get(`/stock-receipts/process-bill/${jobId}`, { timeout: 20000 });
      const job = res.data as { status: string; result: unknown; error?: string };
      if (job.status === 'done') { data = job.result; break; }
      if (job.status === 'error') throw new Error(job.error || 'OCR bill thất bại.');
      if (Date.now() > deadline) throw new Error('OCR bill quá lâu — thử lại hoặc dùng ảnh nhẹ hơn.');
    }
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

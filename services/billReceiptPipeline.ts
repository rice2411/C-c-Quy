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

/** base64 thuần → Blob nhị phân (để upload multipart, KHÔNG gửi base64 qua mạng). */
function base64ToBlob(b64: string, mime = 'image/jpeg'): Blob {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Upload ảnh tạo job OCR, retry vài lần khi lỗi mạng (tunnel chập chờn). Trả jobId. */
async function startBillJob(imageBase64NoPrefix: string): Promise<string> {
  const blob = base64ToBlob(imageBase64NoPrefix);
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const form = new FormData();
      form.append('file', blob, 'bill.jpg');
      const res = await apiClient.post('/stock-receipts/process-bill/start', form, { timeout: 30000 });
      const jobId = (res.data as { jobId?: string })?.jobId;
      if (jobId) return jobId;
      throw new Error('Không tạo được tác vụ OCR bill.');
    } catch (e) {
      lastErr = e;
      if (attempt < 2) await sleep(1200 * (attempt + 1)); // 1.2s, 2.4s
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Upload ảnh bill thất bại.');
}

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
    // JOB NỀN + upload NHỊ PHÂN (tránh 520 qua Cloudflare Tunnel với request OCR dài):
    // 1) Upload ảnh multipart → BE trả jobId NGAY (kết nối chỉ giữ ~lúc upload, có retry).
    const jobId = await startBillJob(imageBase64NoPrefix);

    // 2) Poll kết quả (mỗi 1.5s, tối đa ~150s). Mỗi poll nhẹ + nhanh nên không đụng
    //    trần 100s của Cloudflare như request đồng bộ cũ; poll lỗi mạng thì thử lại nhịp sau.
    const POLL_MS = 1500;
    const deadline = Date.now() + 150_000;
    let pollErrs = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await sleep(POLL_MS);
      let job: { status: string; result: unknown; error?: string };
      try {
        const res = await apiClient.get(`/stock-receipts/process-bill/${jobId}`, { timeout: 20000 });
        job = res.data as typeof job;
      } catch {
        // Lỗi mạng tạm thời (tunnel giật) → bỏ qua, thử nhịp sau; quá nhiều lần mới bỏ.
        if (++pollErrs >= 6) throw new Error('Mất kết nối khi chờ OCR — thử lại.');
        if (Date.now() > deadline) throw new Error('OCR bill quá lâu — thử lại hoặc dùng ảnh nhẹ hơn.');
        continue;
      }
      pollErrs = 0;
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

import type { BillValidationResult, StockReceiptStructured } from '@/types/billReceipt';
import { apiClient } from '@/services/api/client';

/** Các bước hiển thị tiến trình cho UI. */
export type BillImportProgressStage = 'vision' | 'validate' | 'structure';

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

  // apiClient đã bóc envelope → data = { ocrText, structured, validation }.
  const { data } = await apiClient.post('/stock-receipts/process-bill', {
    imageBase64: imageBase64NoPrefix,
  });

  onProgress?.('structure');

  return data as {
    ocrText: string;
    structured: StockReceiptStructured;
    validation: BillValidationResult;
  };
}

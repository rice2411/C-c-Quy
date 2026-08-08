import type {
  BillValidationResult,
  StockReceiptStructured,
  SupplierContactInfo,
} from '@/types/billReceipt';
import type { UiProgressStage } from './constants';

export type BillJobStatus =
  | 'pending' // chờ tới lượt OCR
  | 'ocr' // đang OCR/cấu trúc
  | 'saving' // đang tự lưu
  | 'saved' // đã lưu
  | 'review' // cần xem/sửa tay
  | 'duplicate' // trùng bill đã có
  | 'error'; // OCR/lưu lỗi

/** 1 bill trong hàng đợi nhập hàng loạt. */
export interface BillJob {
  id: string;
  fileName: string;
  previewUrl: string;
  status: BillJobStatus;
  progressStage: UiProgressStage | null;
  structured: StockReceiptStructured | null;
  validation: BillValidationResult | null;
  ocrText: string;
  imageBase64: string | null;
  imageMimeType: string | null;
  supplierId: string | null;
  supplierContact: SupplierContactInfo;
  confidence: number;
  error?: string;
  existingId?: string; // id phiếu trùng (khi duplicate)
}

/** Ngưỡng độ tự tin để TỰ LƯU (không cần review tay). */
export const AUTO_SAVE_MIN_CONFIDENCE = 0.75;

/** Khoá chống trùng TRONG LÔ: NCC | ngày | tổng tiền. */
export const billDedupKey = (s: StockReceiptStructured | null): string =>
  s ? `${(s.supplierName ?? '').trim().toLowerCase()}|${s.receiptDate ?? ''}|${s.totalAmount ?? ''}` : '';

/**
 * Bill đủ tin cậy để TỰ LƯU: AI xác nhận là bill, confidence cao, có NCC + ≥1 dòng,
 * có tổng tiền > 0, và tổng dòng khớp tổng tiền (±2% hoặc ±2000đ).
 */
export function isAutoSavable(
  s: StockReceiptStructured | null,
  v: BillValidationResult | null,
): boolean {
  if (!s || !v) return false;
  if (!v.isLikelyReceipt) return false;
  if ((v.confidence ?? 0) < AUTO_SAVE_MIN_CONFIDENCE) return false;
  if (!(s.supplierName ?? '').trim()) return false;
  const lines = (s.lineItems ?? []).filter((l) => (l.name ?? '').trim() !== '');
  if (lines.length === 0) return false;
  if (typeof s.totalAmount !== 'number' || s.totalAmount <= 0) return false;
  const lineSum = lines.reduce((acc, l) => acc + (typeof l.lineTotal === 'number' ? l.lineTotal : 0), 0);
  if (lineSum > 0) {
    const diff = Math.abs(lineSum - s.totalAmount);
    if (diff > Math.max(2000, s.totalAmount * 0.02)) return false;
  }
  return true;
}

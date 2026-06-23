/**
 * Service nhập kho — đã migrate sang BE NestJS (module stock-receipts).
 * Mọi I/O đi qua `apiClient`; giữ nguyên signature mọi hàm export để các
 * caller (StockReceipt pages, OrderForm…) không phải đổi.
 *
 * `computeAmountCheck` là hàm THUẦN → giữ nguyên tại FE (không gọi API).
 */

import { apiClient } from '@/services/api/client';
import type {
  ImportedMaterialSummary,
  ImportedSupplierSummary,
  SavedStockReceiptDetail,
  SavedStockReceiptSummary,
  StockReceiptSource,
  StockReceiptStructured,
  StockReceiptValidationSnapshot,
  SupplierContactInfo,
} from '@/types/billReceipt';

const BASE = '/stock-receipts';

/** Hàm thuần (không Firestore) — giữ nguyên tại FE. */
export function computeAmountCheck(structured: StockReceiptStructured): {
  sumLines: number;
  totalAmount: number | null;
  deltaPct: number;
  warn: boolean;
} {
  const sumLines = (structured.lineItems || []).reduce((s, l) => {
    const lt = typeof l.lineTotal === 'number' ? l.lineTotal : 0;
    return s + lt;
  }, 0);
  const totalAmount = typeof structured.totalAmount === 'number' ? structured.totalAmount : null;
  const deltaPct =
    totalAmount && totalAmount > 0 ? Math.abs(sumLines - totalAmount) / totalAmount : 0;
  return { sumLines, totalAmount, deltaPct, warn: deltaPct > 0.02 };
}

/**
 * Lưu phiếu nhập (transaction tạo receipt + lines + upsert supplier/materials).
 * → BE: POST /stock-receipts/draft (createdByUid lấy từ token, không cần gửi).
 * Trả về id phiếu vừa tạo. BE ném DUPLICATE_BILL:<id> / TOO_MANY_LINES khi cần.
 */
export async function saveStockReceiptDraft(input: {
  structured: StockReceiptStructured;
  validation: StockReceiptValidationSnapshot;
  ocrText: string;
  receiptImageBase64?: string | null;
  receiptImageMimeType?: string | null;
  createdByUid?: string | null;
  targetSupplierId?: string | null;
  supplierContact?: SupplierContactInfo | null;
  /** Mặc định 'ocr' (BE coi thiếu = 'ocr'). 'manual' → BE bỏ chống trùng DUPLICATE_BILL. */
  source?: StockReceiptSource;
}): Promise<string> {
  const { createdByUid: _ignore, ...payload } = input;
  const res = await apiClient.post<{ id: string }>(`${BASE}/draft`, payload);
  return res.data.id;
}

/** Cập nhật thông tin NCC → PATCH /stock-receipts/suppliers/:id. */
export async function updateSupplier(
  id: string,
  patch: Partial<SupplierContactInfo> & { name?: string },
): Promise<void> {
  await apiClient.patch(`${BASE}/suppliers/${id}`, patch);
}

/** Danh sách NCC đã nhập → GET /stock-receipts/suppliers. */
export async function fetchImportedSuppliers(): Promise<ImportedSupplierSummary[]> {
  const res = await apiClient.get<ImportedSupplierSummary[]>(`${BASE}/suppliers`);
  return res.data;
}

/** Danh sách nguyên liệu đã nhập → GET /stock-receipts/materials. */
export async function fetchImportedMaterials(): Promise<ImportedMaterialSummary[]> {
  const res = await apiClient.get<ImportedMaterialSummary[]>(`${BASE}/materials`);
  return res.data;
}

export interface MaterialPriceOption {
  id: string;
  name: string;
  unitPrice: number;
}

/**
 * Danh sách nguyên liệu kèm đơn giá nhập trung bình, dùng cho dropdown
 * "Trang trí thêm" khi tạo/sửa đơn → GET /stock-receipts/material-options.
 */
export async function fetchMaterialPriceOptions(): Promise<MaterialPriceOption[]> {
  const res = await apiClient.get<MaterialPriceOption[]>(`${BASE}/material-options`);
  return res.data;
}

/** Danh sách phiếu nhập (summary) → GET /stock-receipts. */
export async function fetchStockReceiptSummaries(): Promise<SavedStockReceiptSummary[]> {
  const res = await apiClient.get<SavedStockReceiptSummary[]>(`${BASE}`);
  return res.data;
}

/** Chi tiết 1 phiếu nhập → GET /stock-receipts/:id. */
export async function fetchStockReceiptDetail(
  receiptId: string,
): Promise<SavedStockReceiptDetail | null> {
  const res = await apiClient.get<SavedStockReceiptDetail | null>(`${BASE}/${receiptId}`);
  return res.data ?? null;
}

// ==================== MERGE OPERATIONS ====================

/**
 * Gộp nhiều suppliers (duplicates) vào 1 supplier root.
 * → BE: POST /stock-receipts/suppliers/merge.
 */
export async function mergeSuppliers(rootId: string, duplicateIds: string[]): Promise<void> {
  await apiClient.post(`${BASE}/suppliers/merge`, { rootId, duplicateIds });
}

/**
 * Gộp nhiều materials (duplicates) vào 1 material root.
 * → BE: POST /stock-receipts/materials/merge.
 */
export async function mergeMaterials(rootId: string, duplicateIds: string[]): Promise<void> {
  await apiClient.post(`${BASE}/materials/merge`, { rootId, duplicateIds });
}

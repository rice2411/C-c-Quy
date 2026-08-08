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

  MaterialStock,
  ImportedSupplierSummary,
  SavedStockReceiptDetail,
  SavedStockReceiptSummary,
  StockReceiptSource,
  StockReceiptStructured,
  StockReceiptValidationSnapshot,
  SupplierContactInfo,
} from '@/types/billReceipt';

const BASE = '/stock-receipts';

/** Hàm thuần (không gọi API) — giữ nguyên tại FE. */
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
  // Kỳ vọng theo bill = dòng hàng + thuế + phí ship − giảm giá (khớp totalAmount).
  const tax = typeof structured.tax === 'number' ? structured.tax : 0;
  const shipping = typeof structured.shippingFee === 'number' ? structured.shippingFee : 0;
  const discount = typeof structured.discount === 'number' ? structured.discount : 0;
  const expected = sumLines + tax + shipping - discount;
  const deltaPct =
    totalAmount && totalAmount > 0 ? Math.abs(expected - totalAmount) / totalAmount : 0;
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
/** Xoá 1 phiếu nhập (BE cascade lines + tài sản/chi phí liên kết + recompute tổng). */
export async function deleteStockReceipt(
  receiptId: string,
): Promise<{ ok: boolean; reason?: string }> {
  const res = await apiClient.delete<{ ok: boolean; reason?: string }>(`${BASE}/${receiptId}`);
  return res.data;
}

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

/** Tồn dư (neo kiểm kê) → GET /stock-receipts/materials/stock-estimate. */
export async function fetchMaterialStock(): Promise<MaterialStock[]> {
  const res = await apiClient.get<unknown[]>(`${BASE}/materials/stock-estimate`);
  const numOrNull = (v: unknown): number | null =>
    typeof v === 'number' && Number.isFinite(v) ? v : null;
  return Array.isArray(res.data)
    ? res.data.map((raw) => {
        const r = (raw ?? {}) as Record<string, unknown>;
        return {
          materialId: typeof r.materialId === 'string' ? r.materialId : '',
          unit: typeof r.unit === 'string' ? r.unit : null,
          hasStocktake: r.hasStocktake === true,
          stocktakeDate: typeof r.stocktakeDate === 'string' ? r.stocktakeDate : null,
          stocktakeQty: numOrNull(r.stocktakeQty),
          importedAfter: numOrNull(r.importedAfter),
          consumedAfter: numOrNull(r.consumedAfter),
          remainingUnit: numOrNull(r.remainingUnit),
          remainingGrams: numOrNull(r.remainingGrams),
        };
      })
    : [];
}


/** Ghi 1 lần kiểm kê NVL → POST /stock-receipts/materials/:id/stocktake. */
export async function recordStocktake(
  materialId: string,
  countedQty: number,
  countDate?: string,
  note?: string,
): Promise<void> {
  await apiClient.post(`${BASE}/materials/${materialId}/stocktake`, { countedQty, countDate, note });
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

// ==================== MATERIAL MERGE SUGGESTIONS ====================

/** 1 thành viên trong cặp gợi ý gộp NVL trùng (subset của ImportedMaterialSummary). */
export interface MaterialMergeCandidate {
  id: string;
  name: string;
  importCount: number;
  totalQty: number;
  canonicalUnit?: string | null;
}

/** 1 cặp NVL nghi trùng kèm độ giống (0–1) — BE trả về mảng các cặp này. */
export interface MaterialMergeSuggestionPair {
  /** Độ giống 0–1 giữa 2 NVL. */
  similarity: number;
  a: MaterialMergeCandidate;
  b: MaterialMergeCandidate;
}

/** Type guard 1 candidate thô từ API (mọi field untrusted). */
function toCandidate(raw: any): MaterialMergeCandidate {
  const r = raw ?? {};
  return {
    id: typeof r.id === 'string' ? r.id : '',
    name: typeof r.name === 'string' ? r.name : '',
    importCount: typeof r.importCount === 'number' ? r.importCount : 0,
    totalQty: typeof r.totalQty === 'number' ? r.totalQty : 0,
    canonicalUnit: typeof r.canonicalUnit === 'string' ? r.canonicalUnit : null,
  };
}

/**
 * Gợi ý các cặp NVL nghi trùng để gộp → GET /stock-receipts/materials/merge-suggestions.
 * `threshold` 0–1: ngưỡng độ giống tối thiểu (mặc định để BE quyết khi bỏ trống).
 * Type-guard dữ liệu thô + lọc cặp thiếu id để client union-find không vỡ.
 */
export async function fetchMaterialMergeSuggestions(
  threshold?: number,
): Promise<MaterialMergeSuggestionPair[]> {
  const res = await apiClient.get<unknown>(`${BASE}/materials/merge-suggestions`, {
    params: typeof threshold === 'number' ? { threshold } : undefined,
  });
  const rows = Array.isArray(res.data) ? res.data : [];
  return rows
    .map((raw: any) => ({
      similarity: typeof raw?.similarity === 'number' ? raw.similarity : 0,
      a: toCandidate(raw?.a),
      b: toCandidate(raw?.b),
    }))
    .filter((p) => p.a.id && p.b.id && p.a.id !== p.b.id);
}

/** 1 nhóm NVL do AI (Claude) gợi ý gộp — cùng sản phẩm. */
export interface MaterialMergeAiGroup {
  members: MaterialMergeCandidate[];
  /** Tên chuẩn AI đề xuất. */
  suggestedName: string;
  /** Đơn vị chuẩn AI đề xuất (null nếu không chắc). */
  suggestedUnit: string | null;
  /** Độ tin cậy 0–1. */
  confidence: number;
  /** Lý do ngắn (tiếng Việt). */
  reason: string;
}

/**
 * Gợi ý gộp NVL bằng AI (Claude) → GET /stock-receipts/materials/merge-suggestions/ai.
 * BE gom nhóm cùng sản phẩm (chịu OCR sai/thiếu dấu). Type-guard thô + lọc nhóm <2.
 */
export async function fetchMaterialMergeSuggestionsAi(): Promise<MaterialMergeAiGroup[]> {
  const res = await apiClient.get<unknown>(`${BASE}/materials/merge-suggestions/ai`);
  const rows = Array.isArray(res.data) ? res.data : [];
  return rows
    .map((raw: any) => ({
      members: Array.isArray(raw?.members)
        ? raw.members.map(toCandidate).filter((m: MaterialMergeCandidate) => m.id)
        : [],
      suggestedName: typeof raw?.suggestedName === 'string' ? raw.suggestedName : '',
      suggestedUnit: typeof raw?.suggestedUnit === 'string' ? raw.suggestedUnit : null,
      confidence: typeof raw?.confidence === 'number' ? raw.confidence : 0,
      reason: typeof raw?.reason === 'string' ? raw.reason : '',
    }))
    .filter((g) => g.members.length >= 2);
}

/** Sửa tên / đơn vị chuẩn của 1 NVL → PATCH /stock-receipts/materials/:id. */
export async function updateMaterial(
  id: string,
  patch: { name?: string; canonicalUnit?: string },
): Promise<void> {
  await apiClient.patch(`${BASE}/materials/${id}`, patch);
}

/**
 * Tạo NVL thủ công (không qua phiếu nhập) → POST /stock-receipts/materials.
 * Idempotent theo tên (BE trả id NVL cũ nếu đã tồn tại). Trả id.
 */
export async function createMaterial(input: {
  name: string;
  unit?: string | null;
  lastUnitPrice?: number | null;
  quantity?: number | null;
  lastSupplierId?: string | null;
  lastSupplierName?: string | null;
  lastReceiptDate?: string | null;
}): Promise<string> {
  const res = await apiClient.post<{ id: string }>(`${BASE}/materials`, input);
  return typeof res.data?.id === 'string' ? res.data.id : '';
}

// ==================== ĐỐI SOÁT (tiền ra ↔ phiếu nhập) ====================

/** 1 phiếu nhập + field đối soát — đối soát tiền ra ↔ phiếu nhập (tab Tiền ra). */
export interface ReconcileReceiptItem {
  receiptId: string;
  supplierName?: string | null;
  totalAmount?: number | null;
  receiptDate?: string | null;
  invoiceNumber?: string | null;
  transactionId?: string | null;
  reconciled: boolean;
}

/** Danh sách phiếu nhập cho đối soát — GET /stock-receipts/for-reconcile. */
export async function fetchReceiptsForReconcile(): Promise<ReconcileReceiptItem[]> {
  const res = await apiClient.get<ReconcileReceiptItem[]>(`${BASE}/for-reconcile`);
  return res.data ?? [];
}

/** Gắn 1 giao dịch tiền ra cho 1 phiếu nhập — POST /stock-receipts/:id/reconcile. */
export async function reconcileReceipt(receiptId: string, transactionId: string): Promise<void> {
  await apiClient.post(`${BASE}/${receiptId}/reconcile`, { transactionId });
}

/** Gỡ đối soát phiếu nhập — POST /stock-receipts/:id/unreconcile. */
export async function unreconcileReceipt(receiptId: string): Promise<void> {
  await apiClient.post(`${BASE}/${receiptId}/unreconcile`);
}

// -------- Auto-suggest khớp phiếu nhập ↔ tiền ra --------
const numOr0 = (v: unknown): number => (typeof v === 'number' ? v : 0);
const strOrNull = (v: unknown): string | null => (typeof v === 'string' ? v : null);

/** 1 cặp gợi ý khớp (tiền ra ↔ phiếu nhập). */
export interface ReceiptReconcileMatch {
  transactionId: string;
  receiptId: string;
  amount: number;
  transactionDate: string | null;
  receiptDate: string | null;
  gateway: string | null;
  supplier: string | null;
  invoiceNumber: string | null;
  description: string | null;
}

export interface ReceiptReconcilePreview {
  matched: ReceiptReconcileMatch[];
  skippedAmbiguous: number;
  skippedNoMatch: number;
  totalUnlinkedTx: number;
  totalUnlinkedReceipt: number;
}

/** 1 GD tiền ra chưa gắn phiếu (khớp tay). */
export interface UnlinkedOutTxn {
  id: string;
  amount: number;
  transactionDate: string | null;
  gateway: string | null;
  content: string | null;
}

function toMatch(r: any): ReceiptReconcileMatch {
  return {
    transactionId: strOrNull(r?.transactionId) ?? '',
    receiptId: strOrNull(r?.receiptId) ?? '',
    amount: numOr0(r?.amount),
    transactionDate: strOrNull(r?.transactionDate),
    receiptDate: strOrNull(r?.receiptDate),
    gateway: strOrNull(r?.gateway),
    supplier: strOrNull(r?.supplier),
    invoiceNumber: strOrNull(r?.invoiceNumber),
    description: strOrNull(r?.description),
  };
}

/** Gợi ý cặp khớp tự động — POST /stock-receipts/reconcile/preview. */
export async function stockReceiptReconcilePreview(
  windowDays = 3,
): Promise<ReceiptReconcilePreview> {
  const res = await apiClient.post<any>(`${BASE}/reconcile/preview`, { windowDays });
  const d = res.data ?? {};
  return {
    matched: Array.isArray(d.matched) ? d.matched.map(toMatch) : [],
    skippedAmbiguous: numOr0(d.skippedAmbiguous),
    skippedNoMatch: numOr0(d.skippedNoMatch),
    totalUnlinkedTx: numOr0(d.totalUnlinkedTx),
    totalUnlinkedReceipt: numOr0(d.totalUnlinkedReceipt),
  };
}

/** Áp danh sách cặp đã chọn — POST /stock-receipts/reconcile/apply. */
export async function stockReceiptReconcileApply(
  pairs: { receiptId: string; transactionId: string }[],
): Promise<{ applied: number; skipped: number }> {
  const res = await apiClient.post<any>(`${BASE}/reconcile/apply`, { pairs });
  return { applied: numOr0(res.data?.applied), skipped: numOr0(res.data?.skipped) };
}

/** GD tiền ra chưa gắn phiếu — GET /stock-receipts/unlinked-out-txns. */
export async function fetchUnlinkedOutTxns(): Promise<UnlinkedOutTxn[]> {
  const res = await apiClient.get<any[]>(`${BASE}/unlinked-out-txns`);
  return Array.isArray(res.data)
    ? res.data.map((r) => ({
        id: strOrNull(r?.id) ?? '',
        amount: numOr0(r?.amount),
        transactionDate: strOrNull(r?.transactionDate),
        gateway: strOrNull(r?.gateway),
        content: strOrNull(r?.content),
      }))
    : [];
}

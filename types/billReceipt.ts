/** Kết quả kiểm tra “có phải bill/phiếu mua hàng” sau OCR. */
export interface BillValidationResult {
  isLikelyReceipt: boolean;
  /** 0–1 */
  confidence: number;
  /** Giải thích ngắn (tiếng Việt) */
  reasonVi: string;
  /** Điểm heuristics 0–1 (từ khóa, số, độ dài) */
  heuristicScore: number;
  heuristicNoteVi: string;
}

/** Kết quả chuẩn hoá từ hoá đơn / phiếu nhập hàng (OCR + LLM). */
export interface BillLineItem {
  name: string;
  quantity: number | null;
  unit: string | null;
  unitPrice: number | null;
  lineTotal: number | null;
}

export interface StockReceiptStructured {
  /** Tên NCC / cửa hàng / siêu thị trên bill */
  supplierName: string | null;
  /** Địa chỉ hoặc chi nhánh nếu có */
  storeOrBranch: string | null;
  /** Ngày trên bill, ưu tiên ISO yyyy-mm-dd */
  receiptDate: string | null;
  /** Giờ nếu có */
  receiptTime: string | null;
  lineItems: BillLineItem[];
  /** Số dòng sản phẩm (có thể khác length nếu gộp dòng) */
  productLineCount: number;
  subtotal: number | null;
  tax: number | null;
  discount: number | null;
  /** Tổng thanh toán */
  totalAmount: number | null;
  currency: string;
  paymentMethod: string | null;
  notes: string | null;
}

export interface StockReceiptValidationSnapshot {
  isLikelyReceipt: boolean;
  confidence: number;
  reasonVi: string;
  heuristicScore: number;
  heuristicNoteVi: string;
}

export interface SavedStockReceiptSummary {
  id: string;
  supplierNameRaw: string | null;
  storeOrBranch: string | null;
  receiptDate: string | null;
  totalAmount: number | null;
  currency: string;
  productLineCount: number;
  createdAt?: string;
}

export interface SavedStockReceiptDetail extends SavedStockReceiptSummary {
  subtotal: number | null;
  tax: number | null;
  discount: number | null;
  paymentMethod: string | null;
  notes: string | null;
  ocrText: string;
  receiptImageBase64?: string;
  receiptImageMimeType?: string;
  lineItems: BillLineItem[];
  validation: StockReceiptValidationSnapshot;
}

export interface ImportedSupplierSummary {
  id: string;
  name: string;
  normalizedName: string;
  receiptCount: number;
  totalAmount: number;
  lastReceiptDate?: string;
}

export interface ImportedMaterialSummary {
  id: string;
  name: string;
  normalizedName: string;
  importCount: number;
  totalQty: number;
  totalAmount: number;
  lastSupplierName?: string;
  lastReceiptDate?: string;
}

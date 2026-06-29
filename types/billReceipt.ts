/** Kết quả kiểm tra "có phải bill/phiếu mua hàng" sau OCR. */
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
  /** Số điện thoại NCC trích từ bill (ĐT/SĐT/Hotline). */
  supplierPhone: string | null;
  /** Địa chỉ NCC trích từ bill (Địa chỉ / Đ/C / Address). */
  supplierAddress: string | null;
  /** Mã / Số hoá đơn trên bill (HĐGTGT, Số HĐ, Mã HĐ, "Hoá đơn số:"). */
  invoiceNumber: string | null;
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

/** Nguồn tạo phiếu nhập: OCR ảnh bill hoặc nhập thủ công qua form (bill viết tay). */
export type StockReceiptSource = 'ocr' | 'manual';

/**
 * Thông tin liên hệ + phân loại NCC để thống kê / quản lý.
 * Tất cả optional vì có thể fill dần qua nhiều lần nhập bill.
 */
export interface SupplierContactInfo {
  /** Số điện thoại chính */
  phone?: string | null;
  /** Địa chỉ đầy đủ */
  address?: string | null;
  /** Người liên hệ (sale, chủ shop…) */
  contactPerson?: string | null;
  email?: string | null;
  /** Mã số thuế (cho hoá đơn VAT) */
  taxCode?: string | null;
  /** Danh mục: "Bột & ngũ cốc", "Sữa & bơ", "Bao bì", … */
  category?: string | null;
  /** Ghi chú nội bộ (giá tốt, giao nhanh, hay hết hàng…) */
  notes?: string | null;
}

export interface SavedStockReceiptSummary {
  id: string;
  supplierNameRaw: string | null;
  storeOrBranch: string | null;
  receiptDate: string | null;
  invoiceNumber: string | null;
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

export interface ImportedSupplierSummary extends SupplierContactInfo {
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
  /** Đơn vị chuẩn hoá (canonical) của NVL, vd "kg", "lít", "cái". */
  canonicalUnit?: string | null;
  /** Đơn giá nhập gần nhất (VND). */
  lastUnitPrice?: number | null;
  lastSupplierName?: string;
  lastReceiptDate?: string;
}

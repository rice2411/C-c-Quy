export interface Transaction {
  id: string;
  accountNumber: string;
  accumulated: number;
  code: string | null;
  content: string;
  createdAt: string;
  description: string;
  gateway: string;
  orderNumber: string;
  receivedAt: string;
  referenceCode: string;
  sepayId: number;
  subAccount: string;
  transactionDate: string;
  transferAmount: number;
  transferType: string; // 'in' | 'out'
  /** Giao dịch không liên quan đến hệ thống (đánh dấu thủ công) */
  isExternal?: boolean;
  /** Tiền RA đã "kết toán" — chuyển về tài khoản chính (đánh dấu thủ công) */
  settledOut?: boolean;
  /** Phân loại chi phí (nội dung CK → category; auto hoặc set tay). */
  expenseCategory?: string | null;
  /** Loại khỏi chi phí (nội bộ / trả NCC đã tính COGS...) — không trừ lợi nhuận. */
  costExcluded?: boolean;
  /** Nhận tiền khớp ≥2 đơn cùng số tiền → webhook không auto-PAID, cần đối soát tay. */
  needsReview?: boolean;
  /** Ghi chú lý do cần đối soát (vd "2 đơn cùng số tiền — cần đối soát thủ công"). */
  reviewNote?: string | null;
}

/** Category chi phí vận hành (union — theo types-convention). */
export type ExpenseCategory =
  | 'rent' | 'utilities' | 'internet' | 'marketing' | 'maintenance' | 'salary' | 'facility'
  | 'supplier' | 'shipping' | 'packaging' | 'other'
  // Nhóm PHI-CHI-PHÍ (cost:false) — KHÔNG tính vào P&L quán khi gán.
  | 'personal' | 'owner' | 'internal';

/** cost=false → không tính vào chi phí quán (cá nhân/rút vốn/nội bộ). Mặc định coi là chi phí. */
export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; cost?: boolean }[] = [
  { value: 'rent', label: 'Thuê mặt bằng' },
  { value: 'utilities', label: 'Điện nước' },
  { value: 'internet', label: 'Internet/ĐT' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'maintenance', label: 'Bảo trì' },
  { value: 'salary', label: 'Lương' },
  { value: 'facility', label: 'CSVC/Thiết bị' },
  { value: 'supplier', label: 'Trả NCC/Nhập hàng' },
  { value: 'shipping', label: 'Vận chuyển/Ship' },
  { value: 'packaging', label: 'Bao bì/Hộp' },
  { value: 'other', label: 'Khác' },
  { value: 'personal', label: 'Cá nhân (không tính)', cost: false },
  { value: 'owner', label: 'Rút vốn (không tính)', cost: false },
  { value: 'internal', label: 'Nội bộ/Nạp ví (không tính)', cost: false },
];

export const expenseCategoryLabel = (c?: string | null): string =>
  EXPENSE_CATEGORIES.find((x) => x.value === c)?.label ?? (c ? 'Khác' : '—');

/** Category này có tính vào chi phí quán không (khớp expense_category_is_cost ở BE). */
export const expenseCategoryIsCost = (c?: string | null): boolean =>
  !!c && c !== 'personal' && c !== 'owner' && c !== 'internal';

/** Rule phân loại chi phí (nội dung CK chứa keyword → category). */
export interface ExpenseRule {
  id: string;
  keyword: string;
  category: ExpenseCategory | string;
}

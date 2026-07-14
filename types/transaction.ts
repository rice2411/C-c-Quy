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
}

/** Category chi phí vận hành (union — theo types-convention). */
export type ExpenseCategory =
  | 'rent' | 'utilities' | 'internet' | 'marketing' | 'maintenance' | 'salary' | 'facility' | 'other';

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'rent', label: 'Thuê mặt bằng' },
  { value: 'utilities', label: 'Điện nước' },
  { value: 'internet', label: 'Internet/ĐT' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'maintenance', label: 'Bảo trì' },
  { value: 'salary', label: 'Lương' },
  { value: 'facility', label: 'CSVC/Thiết bị' },
  { value: 'other', label: 'Khác' },
];

export const expenseCategoryLabel = (c?: string | null): string =>
  EXPENSE_CATEGORIES.find((x) => x.value === c)?.label ?? (c ? 'Khác' : '—');

/** Rule phân loại chi phí (nội dung CK chứa keyword → category). */
export interface ExpenseRule {
  id: string;
  keyword: string;
  category: ExpenseCategory | string;
}

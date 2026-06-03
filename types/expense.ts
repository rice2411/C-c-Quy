/** Chi phí khác (nhập tay) — trừ vào lợi nhuận ngoài hoa hồng & nhập kho */
export type ExpenseCategory =
  | 'rent'
  | 'utilities'
  | 'salary'
  | 'marketing'
  | 'equipment'
  | 'other';

export interface Expense {
  id: string;
  description: string;
  /** Số tiền (VND) */
  amount: number;
  /** Ngày chi (ISO yyyy-mm-dd) */
  date: string;
  category: ExpenseCategory;
  note?: string;
  createdAt?: string;
  createdBy?: string;
}

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'rent', label: 'Mặt bằng' },
  { value: 'utilities', label: 'Điện nước' },
  { value: 'salary', label: 'Lương / nhân công' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'equipment', label: 'Thiết bị / dụng cụ' },
  { value: 'other', label: 'Khác' },
];

export const expenseCategoryLabel = (c: ExpenseCategory | string): string =>
  EXPENSE_CATEGORIES.find(x => x.value === c)?.label ?? 'Khác';

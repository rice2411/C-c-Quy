import React from 'react';
import { Tag } from 'lucide-react';
import { Transaction } from '@/types';
import { expenseCategoryTag, expenseCategoryIsCost } from '@/types/transaction';
import Badge from '@/components/ui/Badge';
import Typography from '@/components/ui/Typography';

interface ExpenseTagProps {
  transaction: Transaction;
}

/**
 * Tag phân loại chi phí cho giao dịch tiền RA — tương tự badge mã đơn của tiền vào.
 * Amber = có tính chi phí quán (OPEX); xám = không tính (personal/nội bộ/đã loại).
 * Trả null khi chưa phân loại (để caller hiển thị "—").
 */
const ExpenseTag: React.FC<ExpenseTagProps> = ({ transaction }) => {
  const label = expenseCategoryTag(transaction.expenseCategory);
  if (!label) return null;

  const counted = expenseCategoryIsCost(transaction.expenseCategory) && !transaction.costExcluded;

  return (
    <Badge
      size="sm"
      layoutClassName="inline-flex max-w-[180px] items-center gap-1 px-2.5 py-1 text-xs font-semibold"
      borderClassName={counted ? 'border border-amber-200 dark:border-amber-700' : 'border border-slate-200 dark:border-slate-600'}
      backgroundClassName={counted ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-slate-100 dark:bg-slate-700/40'}
      textClassName={counted ? 'text-amber-700 dark:text-amber-300' : 'text-slate-600 dark:text-slate-300'}
    >
      <Tag className="h-2.5 w-2.5 shrink-0" />
      <Typography as="span" layoutClassName="min-w-0 truncate" title={label}>
        {label}
      </Typography>
    </Badge>
  );
};

export default ExpenseTag;

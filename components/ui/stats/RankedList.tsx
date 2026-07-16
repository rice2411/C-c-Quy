import React from 'react';
import Box from '@/components/ui/Box';

export interface RankedListItem {
  key?: string;
  /** Nội dung chính (tên...) — có thể kèm icon. */
  primary: React.ReactNode;
  /** Dòng phụ (sđt, mô tả...). */
  secondary?: React.ReactNode;
  /** Giá trị phải (đậm). */
  trailing: React.ReactNode;
  /** Giá trị phụ dưới trailing (vd "N đơn"). */
  trailingSub?: React.ReactNode;
  /** Class huy hiệu hạng (bg + text). */
  rankClassName?: string;
}

interface RankedListProps {
  items: RankedListItem[];
  /** 'bordered' = mỗi dòng viền bo; 'divided' = danh sách gạch ngăn. */
  variant?: 'bordered' | 'divided';
  className?: string;
}

/**
 * Danh sách xếp hạng dùng chung: huy hiệu số thứ tự + (chính/phụ) + trị phải.
 * Gom Top khách hàng / Top CTV / ... (khác RankedBarList: có rank + không thanh bar).
 */
const RankedList: React.FC<RankedListProps> = ({ items, variant = 'bordered', className }) => (
  <Box layoutClassName={`${variant === 'divided' ? 'divide-y divide-slate-50 dark:divide-slate-700/50' : 'space-y-1.5'} ${className ?? ''}`}>
    {items.map((it, i) => (
      <Box
        key={it.key ?? i}
        layoutClassName={`flex items-center gap-3 ${variant === 'divided' ? 'px-5 py-3' : 'px-3 py-2'}`}
        borderClassName={variant === 'bordered' ? 'border border-slate-100 dark:border-slate-700' : undefined}
        roundedClassName={variant === 'bordered' ? 'rounded-lg' : undefined}>
        <Box
          layoutClassName={`inline-flex h-7 w-7 shrink-0 items-center justify-center text-xs font-bold ${it.rankClassName ?? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}
          roundedClassName="rounded-full">
          {i + 1}
        </Box>
        <Box layoutClassName="flex min-w-0 flex-1 flex-col">
          {it.primary}
          {it.secondary != null ? it.secondary : null}
        </Box>
        <Box layoutClassName="flex shrink-0 flex-col items-end text-right">
          {it.trailing}
          {it.trailingSub != null ? it.trailingSub : null}
        </Box>
      </Box>
    ))}
  </Box>
);

export default RankedList;

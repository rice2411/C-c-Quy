import React from 'react';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';

export interface RankedBarItem {
  /** Khoá React (mặc định dùng label nếu là string). */
  key?: string;
  label: React.ReactNode;
  /** Giá trị hiển thị đã format (vd formatVND). */
  value: React.ReactNode;
  /** Số dùng tính tỉ lệ thanh bar. */
  amount: number;
}

interface RankedBarListProps {
  items: RankedBarItem[];
  /** Màu thanh bar (Tailwind bg-*). Mặc định primary. */
  barColorClassName?: string;
  className?: string;
}

/**
 * Danh sách "Top N theo X" — mỗi dòng: nhãn … giá trị, thanh bar tỉ lệ theo max.
 * Gom pattern lặp (Top NCC ở Nhập hàng, TopList ở Traffic, ...).
 */
const RankedBarList: React.FC<RankedBarListProps> = ({
  items,
  barColorClassName = 'bg-primary-500',
  className,
}) => {
  const max = items.reduce((m, it) => Math.max(m, it.amount), 0);
  return (
    <Box layoutClassName={`space-y-2.5 ${className ?? ''}`}>
      {items.map((it, i) => {
        const pct = max > 0 ? Math.round((it.amount / max) * 100) : 0;
        return (
          <Box key={it.key ?? (typeof it.label === 'string' ? it.label : i)} layoutClassName="space-y-1">
            <Box layoutClassName="flex items-center gap-2">
              <Typography size="sm" layoutClassName="min-w-0 flex-1 truncate" textClassName="text-slate-600 dark:text-slate-300">
                {it.label}
              </Typography>
              <Typography size="sm" layoutClassName="shrink-0 font-semibold tabular-nums">{it.value}</Typography>
            </Box>
            <Box
              layoutClassName="h-2 w-full overflow-hidden"
              roundedClassName="rounded-full"
              backgroundClassName="bg-slate-100 dark:bg-slate-700">
              <Box
                layoutClassName="h-full"
                roundedClassName="rounded-full"
                backgroundClassName={barColorClassName}
                style={{ width: `${pct}%` }} />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default RankedBarList;

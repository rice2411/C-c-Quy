import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';

/** Format tỷ lệ phần trăm gọn (0.305 -> "30.5%") */
export const pct = (v: number) => `${+(v * 100).toFixed(1)}%`;

/** Spinner nhỏ dùng trong nút (thay cho thẻ animate-spin thô) */
export const ButtonSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <Box layoutClassName={`h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent ${className ?? 'border-white'}`} />
);

/** Badge trạng thái hoa hồng của 1 đơn */
export const CommissionBadge: React.FC<{
  status: 'pending' | 'paid' | undefined;
  cancelled?: boolean;
}> = ({ status, cancelled }) => {
  if (cancelled)
    return (
      <Badge
        size="sm"
        borderClassName="border-transparent"
        backgroundClassName="bg-red-50 dark:bg-red-900/20"
        textClassName="text-[10px] font-semibold text-red-500"
      >
        Đã huỷ
      </Badge>
    );
  if (status === 'paid')
    return (
      <Badge
        size="sm"
        borderClassName="border-transparent"
        backgroundClassName="bg-emerald-50 dark:bg-emerald-900/20"
        textClassName="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
      >
        <CheckCircle2 className="h-3 w-3" /> Đã trả
      </Badge>
    );
  return (
    <Badge
      size="sm"
      borderClassName="border-transparent"
      backgroundClassName="bg-amber-50 dark:bg-amber-900/20"
      textClassName="text-[10px] font-semibold text-amber-600 dark:text-amber-400"
    >
      <Clock className="h-3 w-3" /> Chưa trả
    </Badge>
  );
};

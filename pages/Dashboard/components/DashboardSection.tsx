import React from 'react';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';

interface DashboardSectionProps {
  /** Nhãn vùng (in hoa, tracking rộng) — vd "Hôm nay", "Phân tích" */
  title: string;
  /** Slot bên phải tiêu đề — vd bộ lọc Tuần/Tháng/Năm của vùng Phân tích */
  action?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Khối phân vùng của Dashboard: 1 header (tiêu đề + action tuỳ chọn) +
 * vùng nội dung có khoảng cách dọc đều. Dùng để gom các widget rời rạc
 * thành các nhóm dễ quét mắt.
 */
const DashboardSection: React.FC<DashboardSectionProps> = ({ title, action, children }) => (
  <Box layoutClassName="space-y-4">
    <Box
      layoutClassName="flex flex-col gap-3 pb-2 sm:flex-row sm:items-end sm:justify-between"
      borderClassName="border-b border-slate-100 dark:border-slate-700/60"
    >
      <Heading
        level={2}
        textClassName="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
      >
        {title}
      </Heading>
      {action ? <Box layoutClassName="w-full sm:w-auto">{action}</Box> : null}
    </Box>
    <Box layoutClassName="space-y-6">{children}</Box>
  </Box>
);

export default DashboardSection;

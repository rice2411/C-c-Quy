import React from 'react';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';

export interface EmptyStateProps {
  /** Icon lucide, vd: <Users className="h-6 w-6" />. Tuỳ chọn. */
  icon?: React.ReactNode;
  /** Dòng chính (bắt buộc). */
  title: string;
  /** Dòng phụ tuỳ chọn. */
  description?: string;
  /** Ghi đè layout ngoài cùng (vd min-h khác). */
  layoutClassName?: string;
}

/**
 * Empty state dùng chung toàn app: icon (tuỳ chọn) + text, **căn giữa cả dọc & ngang**,
 * fill chiều cao vùng chứa. Vùng cha nên cho `h-full`/`flex-1` để căn giữa dọc thật.
 */
const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, layoutClassName }) => (
  <Box
    layoutClassName={`flex h-full min-h-[140px] w-full flex-col items-center justify-center gap-2 p-6 text-center ${
      layoutClassName ?? ''
    }`}
  >
    {icon ? (
      <Box
        layoutClassName="inline-flex h-12 w-12 items-center justify-center"
        roundedClassName="rounded-full"
        backgroundClassName="bg-slate-100 dark:bg-slate-700/40"
        textClassName="text-slate-400 dark:text-slate-500"
      >
        {icon}
      </Box>
    ) : null}
    <Typography as="p" size="sm" variant="muted" layoutClassName="max-w-xs text-center">
      {title}
    </Typography>
    {description ? (
      <Typography as="p" size="xs" variant="muted" layoutClassName="max-w-xs text-center">
        {description}
      </Typography>
    ) : null}
  </Box>
);

export default EmptyState;

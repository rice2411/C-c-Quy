import React from 'react';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';

export interface StatItem {
  /** Icon (lucide hoặc bất kỳ component nhận className). Bỏ trống → không hiện ô icon. */
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  /** Sub note bên dưới value */
  sub?: string;
  /** Màu accent (hex) cho ô icon */
  accent?: string;
  /** Class bổ sung cho value (vd 'line-clamp-1' cho tên dài) */
  valueClassName?: string;
}

interface StatsBannerProps {
  items: StatItem[];
  /** Ép số cột tối đa; mặc định auto responsive theo items.length */
  columns?: number;
}

/**
 * Dải thẻ số liệu dùng chung (icon + label + value + accent).
 * Cột auto-responsive theo số item — KHÔNG ép cứng gridTemplateColumns (tránh bẹp mobile).
 * Tailwind cần class tĩnh để purge → dùng lookup map, không nội suy `grid-cols-${n}`.
 */
const COL_CLASS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
  6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
};

const StatsBanner: React.FC<StatsBannerProps> = ({ items, columns }) => {
  const n = Math.min(Math.max(columns ?? items.length, 1), 6);
  const colClass = COL_CLASS[n] ?? 'grid-cols-2 sm:grid-cols-3';
  return (
    <Box
      layoutClassName={`grid gap-2 rounded-xl border p-2 sm:gap-3 sm:p-3 ${colClass}`}
      borderClassName="border-slate-200 dark:border-slate-700"
      backgroundClassName="bg-gradient-to-br from-primary-50/60 via-white to-primary-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800"
    >
      {items.map((it, idx) => {
        const Icon = it.icon;
        const accent = it.accent ?? '#4abab9';
        return (
          <Box
            key={idx}
            layoutClassName="flex flex-col gap-1 rounded-lg p-2 sm:flex-row sm:items-center sm:gap-3 sm:p-3"
            backgroundClassName="bg-white/70 dark:bg-slate-800/40"
            borderClassName="border border-slate-100 dark:border-slate-700"
          >
            {Icon ? (
              <Box
                layoutClassName="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10"
                style={{ backgroundColor: accent + '22', color: accent }}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </Box>
            ) : null}
            <Box layoutClassName="min-w-0 flex-1">
              <Typography size="xs" variant="muted" layoutClassName="font-medium uppercase tracking-wide truncate">
                {it.label}
              </Typography>
              <Typography
                size="sm"
                layoutClassName={`font-bold leading-tight truncate sm:text-base ${it.valueClassName ?? ''}`}
                textClassName="text-slate-900 dark:text-white"
              >
                {it.value}
              </Typography>
              {it.sub ? (
                <Typography size="xs" variant="muted" layoutClassName="mt-0.5 truncate">
                  {it.sub}
                </Typography>
              ) : null}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default StatsBanner;

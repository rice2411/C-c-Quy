import React from 'react';
import { LucideIcon } from 'lucide-react';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';

export interface StatItem {
  icon: LucideIcon;
  label: string;
  value: string;
  /** Sub note bên dưới value */
  sub?: string;
  /** Màu accent */
  accent?: string;
}

interface StatsBannerProps {
  items: StatItem[];
}

const StatsBanner: React.FC<StatsBannerProps> = ({ items }) => {
  return (
    <Box
      layoutClassName="grid gap-2 rounded-xl border p-2 sm:gap-3 sm:p-3"
      borderClassName="border-slate-200 dark:border-slate-700"
      backgroundClassName="bg-gradient-to-br from-primary-50/60 via-white to-primary-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
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
            <Box
              layoutClassName="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10"
              style={{ backgroundColor: accent + '22', color: accent }}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </Box>
            <Box layoutClassName="min-w-0 flex-1">
              <Typography size="xs" variant="muted" layoutClassName="font-medium uppercase tracking-wide truncate">
                {it.label}
              </Typography>
              <Typography
                size="sm"
                layoutClassName="font-bold leading-tight truncate sm:text-base"
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

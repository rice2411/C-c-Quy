import React from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@/components/ui/Box';
import Spinner from '@/components/ui/Spinner';
import Typography from '@/components/ui/Typography';
import { MetricCard, MetricDelta } from './MetricCard';
import type { KpiItem, KpiTone } from '@/hooks/useKpis';

/** Class ô icon theo tone (light + dark) — đồng nhất toàn hệ. */
const TONE_ICON: Record<KpiTone, string> = {
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
  primary: 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400',
  slate: 'bg-slate-50 text-slate-500 dark:bg-slate-900/40 dark:text-slate-400',
};

export interface KpiGridProps {
  items: KpiItem[];
  loading?: boolean;
  /** Chú thích cạnh delta, vd "vs tháng 6". */
  compareText?: string;
  /** Ghi đè grid cols (mặc định 2 / 3 / 6). */
  columnsClassName?: string;
}

/**
 * Lưới KPI dùng chung — render KpiItem[] (từ useKpis) qua MetricCard đồng nhất.
 * 1 nguồn logic (useKpis) + 1 cấu trúc UI (KpiGrid) cho mọi hub thống kê.
 */
const KpiGrid: React.FC<KpiGridProps> = ({
  items, loading, compareText,
  columnsClassName = 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-6',
}) => {
  const navigate = useNavigate();

  if (loading && items.length === 0) {
    return (
      <Box layoutClassName="flex items-center justify-center py-10">
        <Spinner size="lg" textClassName="text-primary-500" />
      </Box>
    );
  }

  return (
    <Box layoutClassName={`grid gap-3 ${columnsClassName}`}>
      {items.map((it) => (
        <MetricCard
          key={it.key}
          label={it.label}
          value={it.display}
          valueClassName={it.valueClassName}
          valueSize="xl"
          icon={it.icon}
          iconWrapClassName={TONE_ICON[it.tone]}
          onClick={it.to ? () => navigate(it.to as string) : undefined}
          footer={
            <>
              <MetricDelta change={it.deltaPct} text={compareText} invert={it.invert} />
              {it.note && (
                <Typography size="xs" layoutClassName="mt-1 line-clamp-1" textClassName="text-[10px] font-medium tracking-wide text-slate-400 dark:text-slate-500" title={it.note}>
                  {it.note}
                </Typography>
              )}
            </>
          }
        />
      ))}
    </Box>
  );
};

export default KpiGrid;

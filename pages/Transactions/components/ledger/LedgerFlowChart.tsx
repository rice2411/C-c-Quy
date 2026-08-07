import React, { useMemo } from 'react';
import { BarChart2 } from 'lucide-react';
import { LedgerSeriesPoint } from '@/types';
import { formatVND } from '@/utils/format/currencyUtil';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';

interface LedgerFlowChartProps {
  series: LedgerSeriesPoint[]; // theo NGÀY (yyyy-mm-dd)
  fromDate: string;
  toDate: string;
}

interface Bucket {
  label: string;
  in: number;
  out: number;
}

/** Biểu đồ thu (xanh, lên) / chi (đỏ, xuống) theo bucket ngày/tuần/tháng. */
const LedgerFlowChart: React.FC<LedgerFlowChartProps> = ({ series, fromDate, toDate }) => {
  const buckets = useMemo<Bucket[]>(() => {
    // So sánh chuỗi 'YYYY-MM-DD' (né Invalid Date iOS). Gom theo độ dài kỳ.
    const days = series.filter((p) => (!fromDate || p.day >= fromDate) && (!toDate || p.day <= toDate.slice(0, 10)));
    if (days.length === 0) return [];
    const span = fromDate && toDate
      ? Math.round((new Date(`${toDate.slice(0, 10)}T00:00:00`).getTime() - new Date(`${fromDate}T00:00:00`).getTime()) / 86_400_000) + 1
      : days.length;
    // <=31 ngày: theo ngày; <=120: theo tuần; còn lại: theo tháng.
    const mode: 'day' | 'week' | 'month' = span <= 31 ? 'day' : span <= 120 ? 'week' : 'month';
    const map = new Map<string, Bucket>();
    const order: string[] = [];
    for (const p of days) {
      const d = new Date(`${p.day}T00:00:00`);
      let key: string;
      let label: string;
      if (mode === 'month') {
        key = p.day.slice(0, 7);
        label = `${d.getMonth() + 1}/${d.getFullYear() % 100}`;
      } else if (mode === 'week') {
        const monday = new Date(d);
        const dow = (d.getDay() + 6) % 7; // 0 = thứ 2
        monday.setDate(d.getDate() - dow);
        key = monday.toISOString().slice(0, 10);
        label = `${monday.getDate()}/${monday.getMonth() + 1}`;
      } else {
        key = p.day;
        label = `${d.getDate()}/${d.getMonth() + 1}`;
      }
      if (!map.has(key)) { map.set(key, { label, in: 0, out: 0 }); order.push(key); }
      const b = map.get(key)!;
      b.in += p.in;
      b.out += p.out;
    }
    return order.sort().map((k) => map.get(k)!);
  }, [series, fromDate, toDate]);

  const max = useMemo(() => Math.max(1, ...buckets.map((b) => Math.max(b.in, b.out))), [buckets]);

  if (buckets.length === 0 || !buckets.some((b) => b.in > 0 || b.out > 0)) return null;

  return (
    <Card
      padding="none"
      layoutClassName="overflow-hidden p-4"
      backgroundClassName="bg-white dark:bg-slate-800"
      borderClassName="border-slate-100 dark:border-slate-700"
    >
      <Box layoutClassName="mb-3 flex items-center justify-between">
        <Box layoutClassName="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-primary-500" />
          <Typography size="xs" variant="muted" layoutClassName="font-semibold uppercase tracking-wide">
            Dòng tiền theo thời gian
          </Typography>
        </Box>
        <Box layoutClassName="flex items-center gap-3">
          <Box layoutClassName="flex items-center gap-1.5">
            <Box layoutClassName="h-2 w-2 rounded-sm" backgroundClassName="bg-emerald-400" />
            <Typography as="span" size="xs" variant="muted">Thu</Typography>
          </Box>
          <Box layoutClassName="flex items-center gap-1.5">
            <Box layoutClassName="h-2 w-2 rounded-sm" backgroundClassName="bg-rose-400" />
            <Typography as="span" size="xs" variant="muted">Chi</Typography>
          </Box>
        </Box>
      </Box>
      <Box layoutClassName="flex items-stretch gap-1 overflow-x-auto pb-1">
        {buckets.map((b, i) => {
          const inPct = b.in > 0 ? Math.max(6, Math.round((b.in / max) * 100)) : 0;
          const outPct = b.out > 0 ? Math.max(6, Math.round((b.out / max) * 100)) : 0;
          return (
            <Box key={i} layoutClassName="group relative flex min-w-0 flex-1 flex-col items-center">
              {(b.in > 0 || b.out > 0) && (
                <Box layoutClassName="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-[10px] text-white shadow group-hover:block dark:bg-slate-600">
                  <Typography as="span" layoutClassName="block">Thu +{formatVND(b.in)}</Typography>
                  <Typography as="span" layoutClassName="block">Chi −{formatVND(b.out)}</Typography>
                </Box>
              )}
              {/* Cột thu (lên) */}
              <Box layoutClassName="flex w-full flex-col justify-end" style={{ height: 44 }}>
                <Box
                  layoutClassName="w-full rounded-t transition-all"
                  backgroundClassName="bg-emerald-400 group-hover:bg-emerald-500 dark:bg-emerald-500"
                  style={{ height: `${inPct}%` }}
                />
              </Box>
              {/* Cột chi (xuống) */}
              <Box layoutClassName="flex w-full flex-col justify-start" style={{ height: 44 }}>
                <Box
                  layoutClassName="w-full rounded-b transition-all"
                  backgroundClassName="bg-rose-400 group-hover:bg-rose-500 dark:bg-rose-500"
                  style={{ height: `${outPct}%` }}
                />
              </Box>
              {buckets.length <= 31 && (
                <Typography as="span" layoutClassName="mt-1 w-full truncate text-center text-[9px]" textClassName="text-slate-400 dark:text-slate-500">
                  {b.label}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    </Card>
  );
};

export default LedgerFlowChart;

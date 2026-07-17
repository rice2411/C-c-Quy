import React, { useState } from 'react';
import { Wallet, Boxes, Building2, Coins } from 'lucide-react';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import StatsBanner from '@/components/ui/StatsBanner';
import { DonutChart, ChartLegend, LINE_TYPE_META } from '@/components/ui/stats';
import DateRangePicker, { DatePreset, computePresetRange } from '@/components/ui/DateRangePicker';
import { useRevenueReport } from '@/hooks/queries/useTransactionsQuery';
import { formatVND } from '@/utils/format/currencyUtil';
import { percentOf } from '@/utils/format/numberUtil';

// Màu 3 nhánh chi phí (nhất quán toàn app — dùng chung LINE_TYPE_META).
const C_STOCK = LINE_TYPE_META.material.color; // Nhập kho (NVL)
const C_DEP = LINE_TYPE_META.asset.color;      // Khấu hao (Tài sản)
const C_OPEX = LINE_TYPE_META.opex.color;      // Vận hành (OPEX)

/** Tổng quan chi phí 3 nhánh: Nhập kho (NVL) · Khấu hao (Tài sản) · Vận hành (OPEX). */
const OverviewTab: React.FC = () => {
  const initial = computePresetRange('month');
  const [fromDate, setFromDate] = useState(initial.from);
  const [toDate, setToDate] = useState(initial.to);
  const [preset, setPreset] = useState<DatePreset>('month');

  const { report, loading } = useRevenueReport({ from: fromDate, to: toDate });

  const applyPreset = (p: DatePreset) => {
    if (p !== 'custom') {
      const r = computePresetRange(p);
      setFromDate(r.from);
      setToDate(r.to);
    }
    setPreset(p);
  };

  const cb = report?.costBreakdown;
  const stockIn = cb?.stockIn ?? 0;
  const depreciation = cb?.depreciation ?? 0;
  const opex = cb?.expenses ?? 0;
  const total = stockIn + depreciation + opex;

  const pie = [
    { key: 'stock', label: 'Nhập kho (NVL)', value: stockIn, color: C_STOCK },
    { key: 'dep', label: 'Khấu hao (Tài sản)', value: depreciation, color: C_DEP },
    { key: 'opex', label: 'Vận hành', value: opex, color: C_OPEX },
  ].filter((x) => x.value > 0);

  return (
    <Box layoutClassName="space-y-4">
      <Box layoutClassName="flex flex-wrap items-center gap-2">
        <Box layoutClassName="ml-auto">
          <DateRangePicker
            fromDate={fromDate}
            toDate={toDate}
            preset={preset}
            onApplyPreset={applyPreset}
            onFromChange={(v) => { setFromDate(v); setPreset('custom'); }}
            onToChange={(v) => { setToDate(v); setPreset('custom'); }}
          />
        </Box>
      </Box>

      {loading ? (
        <Box layoutClassName="flex min-h-[30vh] items-center justify-center">
          <Spinner size="lg" textClassName="text-primary-500" />
        </Box>
      ) : (
        <Box layoutClassName="space-y-4">
          <StatsBanner
            items={[
              { icon: Wallet, label: 'Tổng chi phí kỳ', value: formatVND(total), accent: '#8b5cf6' },
              { icon: Boxes, label: 'Nhập kho (NVL)', value: formatVND(stockIn), accent: C_STOCK },
              { icon: Building2, label: 'Khấu hao', value: formatVND(depreciation), accent: '#64748b' },
              { icon: Coins, label: 'Vận hành', value: formatVND(opex), accent: C_OPEX },
            ]}
          />
          <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
            <Typography size="sm" layoutClassName="font-semibold">Cơ cấu chi phí (3 nhánh)</Typography>
            {pie.length === 0 ? (
              <Typography size="sm" variant="muted">Chưa có chi phí trong kỳ.</Typography>
            ) : (
              <Box layoutClassName="flex flex-col items-center gap-4 sm:flex-row">
                <DonutChart data={pie} formatValue={formatVND} innerRadius={45} outerRadius={80} containerClassName="h-52 w-full sm:w-1/2" />
                <Box layoutClassName="w-full sm:w-1/2">
                  <ChartLegend items={pie.map((x) => ({ label: x.label, color: x.color, value: formatVND(x.value), percent: percentOf(x.value, total) }))} />
                </Box>
              </Box>
            )}
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default OverviewTab;

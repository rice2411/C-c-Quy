import React from 'react';
import { Calendar } from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';

export type DatePreset = 'today' | '7d' | 'month' | 'last_month' | 'custom';

const fmt = (d: Date) => d.toISOString().split('T')[0];

export const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'today', label: 'Hôm nay' },
  { key: '7d', label: '7 ngày' },
  { key: 'month', label: 'Tháng này' },
  { key: 'last_month', label: 'Tháng trước' },
];

/** Tính khoảng ngày cho preset (dùng new Date theo local) */
export const computePresetRange = (preset: DatePreset): { from: string; to: string } => {
  const today = new Date();
  if (preset === 'today') return { from: fmt(today), to: fmt(today) };
  if (preset === '7d') {
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    return { from: fmt(from), to: fmt(today) };
  }
  if (preset === 'last_month') {
    const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const last = new Date(today.getFullYear(), today.getMonth(), 0);
    return { from: fmt(first), to: fmt(last) };
  }
  // month (mặc định)
  return { from: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), to: fmt(today) };
};

interface PeriodFilterProps {
  fromDate: string;
  toDate: string;
  preset: DatePreset;
  onApplyPreset: (p: DatePreset) => void;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}

const PeriodFilter: React.FC<PeriodFilterProps> = ({
  fromDate, toDate, preset, onApplyPreset, onFromChange, onToChange,
}) => (
  <Card padding="none" layoutClassName="p-3 sm:p-4" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
    <Box layoutClassName="flex flex-wrap items-center gap-1.5">
      {DATE_PRESETS.map(p => {
        const active = preset === p.key;
        return (
          <Button
            key={p.key}
            type="button"
            onClick={() => onApplyPreset(p.key)}
            variant="ghost"
            disableVariantHover
            disableVariantTextColor
            roundedClassName="rounded-full"
            sizeClassName="px-3 py-1 text-xs"
            stateClassName="transition-colors"
            borderClassName={active ? 'border border-primary-400 dark:border-primary-600' : 'border border-slate-200 hover:border-primary-300 dark:border-slate-600 dark:hover:border-primary-700'}
            backgroundClassName={active ? 'bg-primary-50 dark:bg-primary-900/30' : 'bg-white hover:bg-primary-50 dark:bg-slate-800'}
            textClassName={active ? 'font-medium text-primary-700 dark:text-primary-300' : 'font-medium text-slate-600 dark:text-slate-400'}>
            {p.label}
          </Button>
        );
      })}
      <Typography as="span" size="xs" layoutClassName="ml-1" textClassName="text-slate-300 dark:text-slate-600">|</Typography>
      <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <Input
        type="date"
        value={fromDate}
        onChange={(e) => onFromChange(e.target.value)}
        sizeClassName="px-2 py-1 text-xs"
        backgroundClassName="bg-slate-50 dark:bg-slate-700"
        borderClassName="border-slate-200 dark:border-slate-600"
        textClassName="text-slate-700 dark:text-slate-200"
        focusClassName="focus:ring-1"
      />
      <Typography as="span" size="xs" variant="muted">—</Typography>
      <Input
        type="date"
        value={toDate}
        onChange={(e) => onToChange(e.target.value)}
        sizeClassName="px-2 py-1 text-xs"
        backgroundClassName="bg-slate-50 dark:bg-slate-700"
        borderClassName="border-slate-200 dark:border-slate-600"
        textClassName="text-slate-700 dark:text-slate-200"
        focusClassName="focus:ring-1"
      />
    </Box>
  </Card>
);

export default PeriodFilter;

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';

export type DatePreset = 'today' | '7d' | 'month' | 'last_month' | 'custom';

const fmt = (d: Date) => d.toISOString().split('T')[0];
/** ISO yyyy-mm-dd → dd/mm/yyyy (rỗng nếu không có) */
const fmtLabel = (d: string) => (d ? d.split('-').reverse().join('/') : '—');

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
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Nhãn hiển thị trên nút: tên preset nếu là preset, còn không thì "Tùy chọn"
  const triggerLabel = useMemo(() => {
    if (preset === 'custom') return 'Tùy chọn';
    return DATE_PRESETS.find((p) => p.key === preset)?.label ?? 'Tùy chọn';
  }, [preset]);

  const handlePreset = (p: DatePreset) => {
    onApplyPreset(p);
    setOpen(false);
  };

  return (
    <Box layoutClassName="relative inline-block" ref={wrapperRef as React.RefObject<HTMLDivElement>}>
      {/* Nút trigger gọn hiển thị khoảng ngày đang chọn */}
      <Button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        variant="secondary"
        disableVariantHover
        layoutClassName="inline-flex items-center gap-2"
        sizeClassName="px-3 py-2 text-sm"
        roundedClassName="rounded-xl"
        borderClassName="border border-slate-200 dark:border-slate-600"
        backgroundClassName="bg-white dark:bg-slate-800"
        hoverClassName="hover:border-primary-300 dark:hover:border-primary-700"
        stateClassName="transition-colors">
        <Calendar className="h-4 w-4 shrink-0 text-primary-500" />
        <Typography as="span" size="sm" textClassName="font-medium text-slate-700 dark:text-slate-200">
          {fmtLabel(fromDate)} — {fmtLabel(toDate)}
        </Typography>
        <Box
          layoutClassName="px-2 py-0.5"
          roundedClassName="rounded-full"
          backgroundClassName="bg-primary-50 dark:bg-primary-900/30">
          <Typography as="span" size="xs" textClassName="font-medium text-primary-700 dark:text-primary-300">
            {triggerLabel}
          </Typography>
        </Box>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>

      {/* Popover: cột preset + khối tùy chọn */}
      {open ? (
        <Box
          layoutClassName="absolute left-0 top-full z-30 mt-2 flex w-[19rem] flex-col gap-3 rounded-xl border p-3 shadow-lg sm:w-[22rem] sm:flex-row"
          borderClassName="border-slate-200 dark:border-slate-700"
          backgroundClassName="bg-white dark:bg-slate-800">
          {/* Cột preset nhanh */}
          <Box layoutClassName="flex flex-col gap-1 sm:w-32 sm:shrink-0">
            <Typography
              as="span"
              size="xs"
              layoutClassName="mb-0.5 px-1 font-medium uppercase tracking-wide"
              variant="muted">
              Nhanh
            </Typography>
            {DATE_PRESETS.map((p) => {
              const active = preset === p.key;
              return (
                <Button
                  key={p.key}
                  type="button"
                  onClick={() => handlePreset(p.key)}
                  variant="ghost"
                  disableVariantHover
                  disableVariantTextColor
                  layoutClassName="w-full justify-start"
                  sizeClassName="px-3 py-1.5 text-sm"
                  roundedClassName="rounded-lg"
                  stateClassName="transition-colors"
                  borderClassName="border border-transparent"
                  backgroundClassName={active ? 'bg-primary-50 dark:bg-primary-900/30' : 'bg-transparent'}
                  hoverClassName={active ? '' : 'hover:bg-slate-50 dark:hover:bg-slate-700/60'}
                  textClassName={active
                    ? 'font-medium text-primary-700 dark:text-primary-300'
                    : 'font-medium text-slate-600 dark:text-slate-300'}>
                  {p.label}
                </Button>
              );
            })}
          </Box>

          {/* Vạch ngăn */}
          <Box
            layoutClassName="hidden w-px shrink-0 sm:block"
            backgroundClassName="bg-slate-100 dark:bg-slate-700" />

          {/* Khối tùy chọn ngày */}
          <Box layoutClassName="flex flex-1 flex-col gap-2">
            <Typography
              as="span"
              size="xs"
              layoutClassName="px-1 font-medium uppercase tracking-wide"
              variant="muted">
              Tùy chọn
            </Typography>
            <Box layoutClassName="flex flex-col gap-1">
              <Typography as="span" size="xs" variant="muted" layoutClassName="px-1">Từ ngày</Typography>
              <Input
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(e) => onFromChange(e.target.value)}
                sizeClassName="px-2.5 py-1.5 text-sm"
                backgroundClassName="bg-slate-50 dark:bg-slate-700"
                borderClassName="border-slate-200 dark:border-slate-600"
                textClassName="text-slate-700 dark:text-slate-200"
                focusClassName="focus:ring-1" />
            </Box>
            <Box layoutClassName="flex flex-col gap-1">
              <Typography as="span" size="xs" variant="muted" layoutClassName="px-1">Đến ngày</Typography>
              <Input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => onToChange(e.target.value)}
                sizeClassName="px-2.5 py-1.5 text-sm"
                backgroundClassName="bg-slate-50 dark:bg-slate-700"
                borderClassName="border-slate-200 dark:border-slate-600"
                textClassName="text-slate-700 dark:text-slate-200"
                focusClassName="focus:ring-1" />
            </Box>
            <Button
              type="button"
              onClick={() => setOpen(false)}
              variant="primary"
              layoutClassName="mt-1 w-full"
              sizeClassName="px-3 py-1.5 text-sm"
              roundedClassName="rounded-lg">
              Áp dụng
            </Button>
          </Box>
        </Box>
      ) : null}
    </Box>
  );
};

export default PeriodFilter;

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import Calendar, {
  DATE_PRESETS,
  type DatePreset,
  computePresetRange,
  fmtLabel,
  parseISO,
  toISO,
} from '@/components/ui/Calendar';

// Re-export để nơi khác dùng chung (giữ tương thích với PeriodFilter cũ)
export { DATE_PRESETS, computePresetRange };
export type { DatePreset };

export interface DateRangePickerProps {
  fromDate: string;
  toDate: string;
  preset: DatePreset;
  onApplyPreset: (p: DatePreset) => void;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}

/**
 * Chọn KHOẢNG ngày + preset (Hôm nay/7 ngày/Tháng này/Tháng trước) — datepicker
 * dùng chung (trước ở pages/Transactions/PeriodFilter). Popover: cột preset + lịch chung.
 * Draft nội bộ chỉ commit khi bấm "Áp dụng" (deferred apply).
 */
const DateRangePicker: React.FC<DateRangePickerProps> = ({
  fromDate, toDate, preset, onApplyPreset, onFromChange, onToChange,
}) => {
  const [open, setOpen] = useState(false);
  // Canh dropdown: nút ở sát mép phải màn → mở xổ sang TRÁI (right-0) cho khỏi tràn/đè.
  const [alignRight, setAlignRight] = useState(false);
  const [draftFrom, setDraftFrom] = useState(fromDate);
  const [draftTo, setDraftTo] = useState(toDate);
  const [draftPreset, setDraftPreset] = useState<DatePreset>(preset);
  const initView = parseISO(fromDate) ?? new Date();
  const [viewY, setViewY] = useState(initView.getFullYear());
  const [viewM, setViewM] = useState(initView.getMonth());
  const wrapperRef = useRef<HTMLDivElement>(null);

  const syncFromProps = () => {
    setDraftFrom(fromDate);
    setDraftTo(toDate);
    setDraftPreset(preset);
    const v = parseISO(fromDate) ?? new Date();
    setViewY(v.getFullYear());
    setViewM(v.getMonth());
  };

  const closePopover = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) closePopover();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closePopover(); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Rộng ~ dropdown desktop (preset + lịch); dùng để quyết canh trái/phải.
  const DROPDOWN_WIDTH = 480;

  const toggleOpen = () => {
    if (!open) {
      syncFromProps();
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (rect) setAlignRight(window.innerWidth - rect.left < DROPDOWN_WIDTH + 16);
    }
    setOpen((v) => !v);
  };

  const triggerLabel = useMemo(() => {
    if (preset === 'custom') return 'Tùy chọn';
    return DATE_PRESETS.find((p) => p.key === preset)?.label ?? 'Tùy chọn';
  }, [preset]);

  const handlePreset = (p: DatePreset) => {
    const r = computePresetRange(p);
    setDraftFrom(r.from);
    setDraftTo(r.to);
    setDraftPreset(p);
    const v = parseISO(r.from) ?? new Date();
    setViewY(v.getFullYear());
    setViewM(v.getMonth());
  };

  // Bấm 1 ngày: bấm đầu → set "từ"; bấm tiếp → set "đến" (tự đảo nếu chọn ngược).
  const pickDay = (iso: string) => {
    setDraftPreset('custom');
    if (!draftFrom || (draftFrom && draftTo)) {
      setDraftFrom(iso);
      setDraftTo('');
    } else if (iso < draftFrom) {
      setDraftTo(draftFrom);
      setDraftFrom(iso);
    } else {
      setDraftTo(iso);
    }
  };

  const handleApply = () => {
    if (draftPreset !== 'custom') {
      onApplyPreset(draftPreset);
    } else {
      onFromChange(draftFrom);
      onToChange(draftTo);
    }
    closePopover();
  };

  const rangeReady = Boolean(draftFrom && draftTo);
  const dirty = draftFrom !== fromDate || draftTo !== toDate || draftPreset !== preset;

  return (
    <Box layoutClassName="relative inline-block" ref={wrapperRef as React.RefObject<HTMLDivElement>}>
      <Button
        type="button"
        onClick={toggleOpen}
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
        <CalendarIcon className="h-4 w-4 shrink-0 text-primary-500" />
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

      {open ? (
        <Box
          layoutClassName={`absolute top-full z-30 mt-2 flex w-[19rem] max-w-[calc(100vw-2rem)] flex-col gap-4 rounded-xl border p-3 shadow-lg sm:w-auto sm:min-w-[30rem] sm:flex-row ${alignRight ? 'right-0' : 'left-0'}`}
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
              const active = draftPreset === p.key;
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

          <Box
            layoutClassName="hidden w-px shrink-0 sm:block"
            backgroundClassName="bg-slate-100 dark:bg-slate-700" />

          {/* Lịch chọn range (dùng Calendar chung) */}
          <Box layoutClassName="flex flex-col gap-2">
            <Calendar
              viewYear={viewY}
              viewMonth={viewM}
              onViewChange={(y, m) => { setViewY(y); setViewM(m); }}
              selectedFrom={draftFrom}
              selectedTo={draftTo}
              onPick={pickDay}
            />
            <Box layoutClassName="flex items-center justify-center gap-1 px-1">
              <Typography as="span" size="xs" variant="muted">
                {fmtLabel(draftFrom)} — {draftTo ? fmtLabel(draftTo) : '…'}
              </Typography>
            </Box>
            <Box layoutClassName="flex items-center gap-2">
              <Button
                type="button"
                onClick={closePopover}
                variant="secondary"
                layoutClassName="flex-1"
                sizeClassName="px-3 py-1.5 text-sm"
                roundedClassName="rounded-lg">
                Huỷ
              </Button>
              <Button
                type="button"
                onClick={handleApply}
                disabled={!dirty || !rangeReady}
                variant="primary"
                layoutClassName="flex-1"
                sizeClassName="px-3 py-1.5 text-sm"
                roundedClassName="rounded-lg">
                Áp dụng
              </Button>
            </Box>
          </Box>
        </Box>
      ) : null}
    </Box>
  );
};

export { toISO };
export default DateRangePicker;

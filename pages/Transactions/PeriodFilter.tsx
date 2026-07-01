import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';

export type DatePreset = 'today' | '7d' | 'month' | 'last_month' | 'custom';

const pad = (n: number) => String(n).padStart(2, '0');
/** Date → ISO yyyy-mm-dd theo LOCAL (tránh lệch ngày do timezone của toISOString) */
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** ISO yyyy-mm-dd → dd/mm/yyyy (rỗng nếu không có) */
const fmtLabel = (d: string) => (d ? d.split('-').reverse().join('/') : '—');
/** ISO yyyy-mm-dd → Date local (null nếu rỗng) */
const parseISO = (s: string): Date | null => {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'today', label: 'Hôm nay' },
  { key: '7d', label: '7 ngày' },
  { key: 'month', label: 'Tháng này' },
  { key: 'last_month', label: 'Tháng trước' },
];

/** Tính khoảng ngày cho preset (dùng new Date theo local) */
export const computePresetRange = (preset: DatePreset): { from: string; to: string } => {
  const today = new Date();
  if (preset === 'today') return { from: toISO(today), to: toISO(today) };
  if (preset === '7d') {
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    return { from: toISO(from), to: toISO(today) };
  }
  if (preset === 'last_month') {
    const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const last = new Date(today.getFullYear(), today.getMonth(), 0);
    return { from: toISO(first), to: toISO(last) };
  }
  // month (mặc định)
  return { from: toISO(new Date(today.getFullYear(), today.getMonth(), 1)), to: toISO(today) };
};

/** 42 ô (6 tuần) bắt đầu từ Thứ 2, phủ trọn tháng đang xem */
const buildGrid = (year: number, month: number): Date[] => {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7; // 0 = Thứ 2
  const start = new Date(year, month, 1 - lead);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
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
  // Draft nội bộ: mọi thay đổi trong popover chỉ áp dụng khi bấm "Áp dụng"
  // (deferred apply — tránh refetch mỗi lần đổi ngày, đúng kiểu dashboard).
  const [draftFrom, setDraftFrom] = useState(fromDate);
  const [draftTo, setDraftTo] = useState(toDate);
  const [draftPreset, setDraftPreset] = useState<DatePreset>(preset);
  // Tháng đang hiển thị trên lịch
  const initView = parseISO(fromDate) ?? new Date();
  const [viewY, setViewY] = useState(initView.getFullYear());
  const [viewM, setViewM] = useState(initView.getMonth());
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Khi mở popover: đồng bộ draft + đưa lịch về tháng của "từ ngày".
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
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        closePopover();
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closePopover(); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggleOpen = () => {
    if (!open) syncFromProps(); // mở → nạp lại draft; đóng thì bỏ qua draft
    setOpen((v) => !v);
  };

  // Nhãn hiển thị trên nút: tên preset ĐÃ commit, còn không thì "Tùy chọn".
  const triggerLabel = useMemo(() => {
    if (preset === 'custom') return 'Tùy chọn';
    return DATE_PRESETS.find((p) => p.key === preset)?.label ?? 'Tùy chọn';
  }, [preset]);

  // Bấm preset → stage vào draft (chưa commit) + đưa lịch về tháng "từ ngày".
  const handlePreset = (p: DatePreset) => {
    const r = computePresetRange(p);
    setDraftFrom(r.from);
    setDraftTo(r.to);
    setDraftPreset(p);
    const v = parseISO(r.from) ?? new Date();
    setViewY(v.getFullYear());
    setViewM(v.getMonth());
  };

  // Bấm 1 ngày trên lịch: bấm đầu → set "từ"; bấm tiếp → set "đến" (tự đảo nếu chọn ngược).
  const pickDay = (d: Date) => {
    const iso = toISO(d);
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

  const goMonth = (delta: number) => {
    const d = new Date(viewY, viewM + delta, 1);
    setViewY(d.getFullYear());
    setViewM(d.getMonth());
  };

  // "Áp dụng" → commit draft ra parent qua contract sẵn có, rồi đóng.
  const handleApply = () => {
    if (draftPreset !== 'custom') {
      onApplyPreset(draftPreset);
    } else {
      onFromChange(draftFrom);
      onToChange(draftTo);
    }
    closePopover();
  };

  const grid = useMemo(() => buildGrid(viewY, viewM), [viewY, viewM]);
  const todayISO = toISO(new Date());
  const rangeReady = Boolean(draftFrom && draftTo);
  const dirty = draftFrom !== fromDate || draftTo !== toDate || draftPreset !== preset;

  return (
    <Box layoutClassName="relative inline-block" ref={wrapperRef as React.RefObject<HTMLDivElement>}>
      {/* Nút trigger gọn hiển thị khoảng ngày đang chọn */}
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

      {/* Popover: cột preset + lịch chọn range */}
      {open ? (
        <Box
          layoutClassName="absolute left-0 top-full z-30 mt-2 flex w-[19rem] flex-col gap-3 rounded-xl border p-3 shadow-lg sm:w-auto sm:flex-row"
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

          {/* Vạch ngăn */}
          <Box
            layoutClassName="hidden w-px shrink-0 sm:block"
            backgroundClassName="bg-slate-100 dark:bg-slate-700" />

          {/* Lịch chọn range */}
          <Box layoutClassName="flex flex-col gap-2">
            {/* Header tháng + điều hướng */}
            <Box layoutClassName="flex items-center justify-between px-1">
              <Button
                type="button"
                onClick={() => goMonth(-1)}
                aria-label="Tháng trước"
                variant="ghost"
                disableVariantHover
                disableVariantTextColor
                sizeClassName="p-1.5"
                roundedClassName="rounded-lg"
                borderClassName="border border-transparent"
                textClassName="text-slate-500 dark:text-slate-400"
                hoverClassName="hover:bg-slate-100 dark:hover:bg-slate-700/60">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Typography as="span" size="sm" textClassName="font-semibold text-slate-700 dark:text-slate-200">
                Tháng {viewM + 1} {viewY}
              </Typography>
              <Button
                type="button"
                onClick={() => goMonth(1)}
                aria-label="Tháng sau"
                variant="ghost"
                disableVariantHover
                disableVariantTextColor
                sizeClassName="p-1.5"
                roundedClassName="rounded-lg"
                borderClassName="border border-transparent"
                textClassName="text-slate-500 dark:text-slate-400"
                hoverClassName="hover:bg-slate-100 dark:hover:bg-slate-700/60">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Box>

            {/* Nhãn thứ */}
            <Box layoutClassName="grid grid-cols-7 gap-0.5">
              {WEEKDAYS.map((w) => (
                <Typography
                  key={w}
                  as="span"
                  size="xs"
                  layoutClassName="flex h-6 items-center justify-center font-medium"
                  textClassName="text-slate-400 dark:text-slate-500">
                  {w}
                </Typography>
              ))}
            </Box>

            {/* Lưới ngày */}
            <Box layoutClassName="grid grid-cols-7 gap-0.5">
              {grid.map((d) => {
                const iso = toISO(d);
                const inMonth = d.getMonth() === viewM;
                const isStart = iso === draftFrom;
                const isEnd = iso === draftTo;
                const isEdge = isStart || isEnd;
                const inRange = rangeReady && iso > draftFrom && iso < draftTo;
                const isToday = iso === todayISO;
                return (
                  <Button
                    key={iso}
                    type="button"
                    onClick={() => pickDay(d)}
                    variant="ghost"
                    disableVariantHover
                    disableVariantTextColor
                    layoutClassName="flex h-8 w-8 items-center justify-center"
                    sizeClassName="p-0 text-sm"
                    roundedClassName="rounded-lg"
                    stateClassName="transition-colors"
                    borderClassName={isToday && !isEdge
                      ? 'border border-primary-300 dark:border-primary-700'
                      : 'border border-transparent'}
                    backgroundClassName={isEdge
                      ? 'bg-primary-500'
                      : inRange
                        ? 'bg-primary-50 dark:bg-primary-900/30'
                        : 'bg-transparent'}
                    hoverClassName={isEdge ? '' : 'hover:bg-slate-100 dark:hover:bg-slate-700/60'}
                    textClassName={isEdge
                      ? 'font-semibold text-white'
                      : inMonth
                        ? (inRange ? 'text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-200')
                        : 'text-slate-300 dark:text-slate-600'}>
                    {d.getDate()}
                  </Button>
                );
              })}
            </Box>

            {/* Tóm tắt range đang chọn */}
            <Box layoutClassName="flex items-center justify-center gap-1 px-1">
              <Typography as="span" size="xs" variant="muted">
                {fmtLabel(draftFrom)} — {draftTo ? fmtLabel(draftTo) : '…'}
              </Typography>
            </Box>

            {/* Hành động */}
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

export default PeriodFilter;

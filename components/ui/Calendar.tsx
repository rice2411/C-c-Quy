import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';

// ===== Date helpers (dùng chung cho DatePicker / DateRangePicker) =====
const pad = (n: number) => String(n).padStart(2, '0');
/** Date → ISO yyyy-mm-dd theo LOCAL (tránh lệch ngày do timezone của toISOString) */
export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** ISO yyyy-mm-dd → dd/mm/yyyy (— nếu rỗng) */
export const fmtLabel = (d: string) => (d ? d.split('-').reverse().join('/') : '—');
/** ISO yyyy-mm-dd → Date local (null nếu rỗng/không hợp lệ) */
export const parseISO = (s: string): Date | null => {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

export const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

// ===== Preset khoảng ngày (dùng cho DateRangePicker) =====
export type DatePreset = 'today' | '7d' | 'month' | 'last_month' | 'custom';

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

interface CalendarProps {
  /** Tháng đang xem */
  viewYear: number;
  viewMonth: number;
  onViewChange: (year: number, month: number) => void;
  /** Ngày bắt đầu được chọn (single: chính là value) */
  selectedFrom?: string;
  /** Ngày kết thúc (chỉ range) */
  selectedTo?: string;
  onPick: (iso: string) => void;
  /** Giới hạn ISO — ngoài khoảng sẽ bị disable */
  min?: string;
  max?: string;
}

/**
 * Lưới lịch tháng dùng chung (thuần hiển thị + emit onPick).
 * Logic single/range do component cha (DatePicker/DateRangePicker) quyết định.
 */
const Calendar: React.FC<CalendarProps> = ({
  viewYear,
  viewMonth,
  onViewChange,
  selectedFrom,
  selectedTo,
  onPick,
  min,
  max,
}) => {
  const grid = useMemo(() => buildGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const todayISO = toISO(new Date());
  const rangeReady = Boolean(selectedFrom && selectedTo);

  const goMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    onViewChange(d.getFullYear(), d.getMonth());
  };

  return (
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
          Tháng {viewMonth + 1} {viewYear}
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
          const inMonth = d.getMonth() === viewMonth;
          const isStart = iso === selectedFrom;
          const isEnd = iso === selectedTo;
          const isEdge = isStart || isEnd;
          const inRange = rangeReady && selectedFrom && selectedTo && iso > selectedFrom && iso < selectedTo;
          const isToday = iso === todayISO;
          const disabled = Boolean((min && iso < min) || (max && iso > max));
          return (
            <Button
              key={iso}
              type="button"
              onClick={() => onPick(iso)}
              disabled={disabled}
              variant="ghost"
              disableVariantHover
              disableVariantTextColor
              layoutClassName="flex h-9 w-9 items-center justify-center"
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
    </Box>
  );
};

export default Calendar;

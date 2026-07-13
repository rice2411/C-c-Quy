import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon } from 'lucide-react';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import Calendar, { fmtLabel, parseISO, toISO } from '@/components/ui/Calendar';

export interface DatePickerProps {
  /** ISO yyyy-mm-dd ('' = chưa chọn) */
  value: string;
  onChange: (v: string) => void;
  id?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  min?: string;
  max?: string;
  placeholder?: string;
  /** Icon trái, mặc định lịch. null = ẩn */
  leftIcon?: React.ReactNode;
}

// Kích thước ước lượng của popover lịch (để canh/không tràn viewport).
const PANEL_W = 288;
const PANEL_H = 340;

/**
 * Chọn 1 ngày — trigger giống Input, mở popover Calendar.
 * Popover render qua PORTAL (position: fixed) để KHÔNG bị overflow của modal/scroll
 * container cắt mất (thay cho `<Input type="date">`).
 */
const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  id,
  disabled,
  fullWidth,
  min,
  max,
  placeholder = 'Chọn ngày',
  leftIcon,
}) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const init = parseISO(value) ?? new Date();
  const [viewY, setViewY] = useState(init.getFullYear());
  const [viewM, setViewM] = useState(init.getMonth());

  const computePos = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let left = r.left;
    if (left + PANEL_W > window.innerWidth - 8) left = window.innerWidth - PANEL_W - 8;
    if (left < 8) left = 8;
    // đủ chỗ bên dưới thì mở xuống, không thì lật lên
    const top = r.bottom + PANEL_H > window.innerHeight - 8
      ? Math.max(8, r.top - PANEL_H - 4)
      : r.bottom + 4;
    setPos({ top, left });
  };

  useEffect(() => {
    if (!open) return;
    const v = parseISO(value) ?? new Date();
    setViewY(v.getFullYear());
    setViewM(v.getMonth());
    computePos();
    const reposition = () => computePos();
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const icon = leftIcon === undefined ? <CalendarIcon className="h-4 w-4 shrink-0 text-slate-400" /> : leftIcon;

  return (
    <Box layoutClassName={fullWidth ? 'block w-full' : 'inline-block'}>
      <Button
        ref={triggerRef}
        type="button"
        id={id}
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        variant="secondary"
        disableVariantHover
        disableVariantTextColor
        layoutClassName={`inline-flex items-center gap-2 ${fullWidth ? 'w-full justify-start' : ''}`}
        sizeClassName="px-3 py-2 text-sm"
        roundedClassName="rounded-lg"
        borderClassName="border border-slate-300 dark:border-slate-600"
        backgroundClassName="bg-white dark:bg-slate-800"
        hoverClassName="hover:border-primary-300 dark:hover:border-primary-700"
        stateClassName="transition-colors">
        {icon}
        <Typography
          as="span"
          size="sm"
          textClassName={value ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}>
          {value ? fmtLabel(value) : placeholder}
        </Typography>
      </Button>

      {open && pos
        ? createPortal(
            <div
              ref={panelRef}
              style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 200 }}
              className="w-fit rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-800"
            >
              <Calendar
                viewYear={viewY}
                viewMonth={viewM}
                onViewChange={(y, m) => { setViewY(y); setViewM(m); }}
                selectedFrom={value}
                onPick={(iso) => { onChange(iso); setOpen(false); }}
                min={min}
                max={max}
              />
              {value ? (
                <Box layoutClassName="mt-2 flex justify-end">
                  <Button
                    type="button"
                    onClick={() => { onChange(''); setOpen(false); }}
                    variant="ghost"
                    disableVariantHover
                    disableVariantTextColor
                    sizeClassName="px-2 py-1 text-xs"
                    roundedClassName="rounded-lg"
                    textClassName="text-slate-500 dark:text-slate-400"
                    hoverClassName="hover:bg-slate-100 dark:hover:bg-slate-700/60">
                    Xoá ngày
                  </Button>
                </Box>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </Box>
  );
};

export { toISO };
export default DatePicker;

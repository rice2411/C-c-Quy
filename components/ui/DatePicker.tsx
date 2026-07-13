import React, { useEffect, useRef, useState } from 'react';
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

/**
 * Chọn 1 ngày — trigger giống Input, mở popover Calendar (dùng chung).
 * Thay cho `<Input type="date">` để đồng bộ giao diện với datepicker Tài chính.
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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const init = parseISO(value) ?? new Date();
  const [viewY, setViewY] = useState(init.getFullYear());
  const [viewM, setViewM] = useState(init.getMonth());

  useEffect(() => {
    if (!open) return;
    // mở → đưa lịch về tháng của value hiện tại
    const v = parseISO(value) ?? new Date();
    setViewY(v.getFullYear());
    setViewM(v.getMonth());
    const onDoc = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const icon = leftIcon === undefined ? <CalendarIcon className="h-4 w-4 shrink-0 text-slate-400" /> : leftIcon;

  return (
    <Box
      layoutClassName={`relative ${fullWidth ? 'block w-full' : 'inline-block'}`}
      ref={wrapperRef as React.RefObject<HTMLDivElement>}>
      <Button
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

      {open ? (
        <Box
          layoutClassName="absolute left-0 top-full z-30 mt-2 w-fit rounded-xl border p-3 shadow-lg"
          borderClassName="border-slate-200 dark:border-slate-700"
          backgroundClassName="bg-white dark:bg-slate-800">
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
        </Box>
      ) : null}
    </Box>
  );
};

// Re-export helper cho tiện dùng chỗ khác
export { toISO };
export default DatePicker;

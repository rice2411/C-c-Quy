import { CalendarEvent, CalendarEventType } from '@/types/calendar';

export interface EventAccent {
  dotClassName: string;
  softBgClassName: string;
  textClassName: string;
}

/** Màu theo LOẠI event. Ca (shift) tách 3 màu theo sortOrder. */
const BY_TYPE: Record<Exclude<CalendarEventType, 'shift'>, EventAccent> = {
  order: {
    dotClassName: 'bg-emerald-500',
    softBgClassName: 'bg-emerald-50 dark:bg-emerald-900/20',
    textClassName: 'text-emerald-700 dark:text-emerald-300',
  },
  custom: {
    dotClassName: 'bg-violet-500',
    softBgClassName: 'bg-violet-50 dark:bg-violet-900/20',
    textClassName: 'text-violet-700 dark:text-violet-300',
  },
  attendance: {
    dotClassName: 'bg-slate-400',
    softBgClassName: 'bg-slate-100 dark:bg-slate-700/50',
    textClassName: 'text-slate-600 dark:text-slate-300',
  },
};

const SHIFT_ACCENTS: EventAccent[] = [
  { dotClassName: 'bg-amber-400', softBgClassName: 'bg-amber-50 dark:bg-amber-900/20', textClassName: 'text-amber-700 dark:text-amber-300' },
  { dotClassName: 'bg-sky-400', softBgClassName: 'bg-sky-50 dark:bg-sky-900/20', textClassName: 'text-sky-700 dark:text-sky-300' },
  { dotClassName: 'bg-indigo-400', softBgClassName: 'bg-indigo-50 dark:bg-indigo-900/20', textClassName: 'text-indigo-700 dark:text-indigo-300' },
];

export const eventAccent = (ev: CalendarEvent): EventAccent => {
  if (ev.type === 'shift') {
    const order = typeof ev.meta?.sortOrder === 'number' ? ev.meta.sortOrder : 1;
    return SHIFT_ACCENTS[(order - 1) % SHIFT_ACCENTS.length] ?? SHIFT_ACCENTS[0];
  }
  return BY_TYPE[ev.type as Exclude<CalendarEventType, 'shift'>] ?? BY_TYPE.custom;
};

/** Nhãn loại (cho thanh lọc + chú thích). */
export const TYPE_LABELS: { type: CalendarEventType; label: string; dotClassName: string }[] = [
  { type: 'order', label: 'Đơn giao', dotClassName: 'bg-emerald-500' },
  { type: 'shift', label: 'Ca làm', dotClassName: 'bg-sky-400' },
  { type: 'custom', label: 'Sự kiện', dotClassName: 'bg-violet-500' },
  { type: 'attendance', label: 'Chấm công', dotClassName: 'bg-slate-400' },
];

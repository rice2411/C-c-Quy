/** Màu nhấn theo ca (sáng/chiều/tối) — dùng chung cho ô lịch + panel. */
export interface ShiftAccent {
  dotClassName: string; // nền chấm tròn
  softBgClassName: string; // nền nhạt cho pill
  textClassName: string; // chữ trên nền nhạt
}

const ACCENTS: ShiftAccent[] = [
  {
    dotClassName: 'bg-amber-400',
    softBgClassName: 'bg-amber-50 dark:bg-amber-900/20',
    textClassName: 'text-amber-700 dark:text-amber-300',
  },
  {
    dotClassName: 'bg-sky-400',
    softBgClassName: 'bg-sky-50 dark:bg-sky-900/20',
    textClassName: 'text-sky-700 dark:text-sky-300',
  },
  {
    dotClassName: 'bg-indigo-400',
    softBgClassName: 'bg-indigo-50 dark:bg-indigo-900/20',
    textClassName: 'text-indigo-700 dark:text-indigo-300',
  },
];

const FALLBACK: ShiftAccent = {
  dotClassName: 'bg-slate-400',
  softBgClassName: 'bg-slate-50 dark:bg-slate-700/40',
  textClassName: 'text-slate-600 dark:text-slate-300',
};

/** Lấy màu theo thứ tự ca (sortOrder 1..3 → index 0..2). */
export const shiftAccent = (sortOrder: number): ShiftAccent =>
  ACCENTS[(sortOrder - 1) % ACCENTS.length] ?? FALLBACK;

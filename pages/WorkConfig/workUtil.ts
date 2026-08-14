import { WageRate } from '@/types/wage';

/** Số giờ của 1 ca từ 'HH:MM'–'HH:MM' (0 nếu không hợp lệ). */
export const shiftHours = (start: string, end: string): number => {
  const [sh, sm] = (start || '').split(':').map(Number);
  const [eh, em] = (end || '').split(':').map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0;
  const mins = eh * 60 + em - (sh * 60 + sm);
  return mins > 0 ? mins / 60 : 0;
};

/** 4 → '4h', 3.5 → '3.5h'. */
export const formatHours = (h: number): string =>
  Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;

const pad2 = (n: number) => String(n).padStart(2, '0');

export const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

/** ISO dow (1=T2..7=CN) của hôm nay. */
export const todayDow = (): number => {
  const d = new Date().getDay(); // 0=CN..6=T7
  return d === 0 ? 7 : d;
};

export const WEEKDAYS: { iso: number; label: string }[] = [
  { iso: 1, label: 'T2' },
  { iso: 2, label: 'T3' },
  { iso: 3, label: 'T4' },
  { iso: 4, label: 'T5' },
  { iso: 5, label: 'T6' },
  { iso: 6, label: 'T7' },
  { iso: 7, label: 'CN' },
];

export const weekdayLabels = (days: number[]): string =>
  days.length === 7 ? 'Cả tuần' : WEEKDAYS.filter((w) => days.includes(w.iso)).map((w) => w.label).join(' · ');

/**
 * Với 1 tập bản ghi lương của 1 vị trí: weekdays còn HIỆU LỰC cho từng bản ghi
 * (mới đè cũ, chỉ tính bản đã tới ngày áp dụng).
 */
export const computeActive = (rows: WageRate[], today: string): Map<string, number[]> => {
  const sorted = [...rows].sort(
    (a, b) =>
      b.effectiveDate.localeCompare(a.effectiveDate) ||
      (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
  );
  const covered = new Set<number>();
  const map = new Map<string, number[]>();
  for (const r of sorted) {
    if (r.effectiveDate > today) continue;
    const active = r.weekdays.filter((d) => !covered.has(d));
    active.forEach((d) => covered.add(d));
    map.set(r.id, active);
  }
  return map;
};

/** Mức lương/giờ ĐANG áp dụng cho (rows 1 vị trí, ngày, thứ). null nếu chưa có. */
export const effectiveRate = (
  rows: WageRate[],
  today: string,
  dow: number,
): number | null => {
  const applicable = rows
    .filter((r) => r.effectiveDate <= today && r.weekdays.includes(dow))
    .sort(
      (a, b) =>
        b.effectiveDate.localeCompare(a.effectiveDate) ||
        (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
    );
  return applicable.length ? applicable[0].hourlyRate : null;
};

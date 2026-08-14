/** Tiện ích ngày cho lịch ca — dùng ngày LOCAL (quán ở VN), tránh lệch timezone. */

export const pad2 = (n: number): string => String(n).padStart(2, '0');

/** Date → 'yyyy-mm-dd' theo local. */
export const toISO = (d: Date): string =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const WEEKDAYS_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const WEEKDAYS_FULL_VI = [
  'Chủ nhật',
  'Thứ 2',
  'Thứ 3',
  'Thứ 4',
  'Thứ 5',
  'Thứ 6',
  'Thứ 7',
];

/** Nhãn thứ ngắn theo thứ tự lịch (T2..CN). */
export const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/** 'yyyy-mm-dd' → 'Thứ 5, 14/08/2026'. */
export const formatDateLabel = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return `${WEEKDAYS_FULL_VI[date.getDay()]}, ${pad2(d)}/${pad2(m)}/${y}`;
};

/** Ma trận 6 tuần (42 ô) cho tháng, tuần bắt đầu Thứ 2. Mỗi ô là Date local. */
export const monthMatrix = (year: number, month: number): Date[][] => {
  const first = new Date(year, month, 1);
  // getDay: 0=CN..6=T7. Đưa về offset tuần bắt đầu T2: T2=0..CN=6.
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w += 1) {
    const row: Date[] = [];
    for (let i = 0; i < 7; i += 1) {
      row.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + i));
    }
    weeks.push(row);
  }
  return weeks;
};

export const MONTH_LABELS_VI = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
];

export { WEEKDAYS_VI };

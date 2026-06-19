import { parseDateValue } from '@/utils/format/dateUtil';
/**
 * Filter helpers theo period cho danh sách NCC / NVL.
 * Field date: `lastReceiptDate` (ISO string).
 */

export type DatePeriod = 'all' | 'this-month' | 'last-month' | '30d' | '90d' | 'this-year';

export const PERIOD_OPTIONS: Array<{ value: DatePeriod; label: string }> = [
  { value: 'all',        label: 'Tất cả thời gian' },
  { value: 'this-month', label: 'Tháng này' },
  { value: 'last-month', label: 'Tháng trước' },
  { value: '30d',        label: '30 ngày gần nhất' },
  { value: '90d',        label: '90 ngày gần nhất' },
  { value: 'this-year',  label: 'Năm nay' },
];

const startOfMonth = (y: number, m: number) => new Date(y, m, 1, 0, 0, 0, 0);
const endOfMonth = (y: number, m: number) => new Date(y, m + 1, 0, 23, 59, 59, 999);

export const filterByPeriod = <T extends { lastReceiptDate?: string }>(
  arr: T[],
  period: DatePeriod,
): T[] => {
  if (period === 'all') return arr;
  const now = new Date();
  let from: Date;
  let to: Date | null = null;

  if (period === 'this-month') {
    from = startOfMonth(now.getFullYear(), now.getMonth());
  } else if (period === 'last-month') {
    from = startOfMonth(now.getFullYear(), now.getMonth() - 1);
    to = endOfMonth(now.getFullYear(), now.getMonth() - 1);
  } else if (period === '30d') {
    from = new Date(Date.now() - 30 * 86400000);
  } else if (period === '90d') {
    from = new Date(Date.now() - 90 * 86400000);
  } else if (period === 'this-year') {
    from = new Date(now.getFullYear(), 0, 1);
  } else {
    return arr;
  }

  return arr.filter((x) => {
    if (!x.lastReceiptDate) return false;
    const d = parseDateValue(x.lastReceiptDate);
    if (Number.isNaN(d.getTime())) return false;
    if (d < from) return false;
    if (to && d > to) return false;
    return true;
  });
};

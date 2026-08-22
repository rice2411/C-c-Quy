// Helper dùng chung cho Bảng lương + Sổ công (theo tháng).
const pad2 = (n: number): string => String(n).padStart(2, '0');

/** 'YYYY-MM' của tháng hiện tại. */
export const currentMonth = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
};

/** Khoảng ngày [đầu tháng, cuối tháng] từ 'YYYY-MM'. */
export const monthRange = (month: string): { from: string; to: string } => {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return { from: `${month}-01`, to: `${month}-${pad2(last)}` };
};

/** Dịch tháng +/- n, giữ dạng 'YYYY-MM'. */
export const shiftMonth = (month: string, delta: number): string => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
};

/** 'YYYY-MM' → 'Tháng 8/2026'. */
export const monthLabel = (month: string): string => {
  const [y, m] = month.split('-');
  return `Tháng ${Number(m)}/${y}`;
};

export const vnd = (n: number): string => `${Math.round(n).toLocaleString('vi-VN')}đ`;

export const fmtHours = (h: number): string =>
  Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;

/** '2026-08-16' → '16/8'. */
export const fmtDay = (iso: string): string => {
  const [, m, d] = iso.split('-');
  return `${Number(d)}/${Number(m)}`;
};

const DOW_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
/** Thứ trong tuần của 'yyyy-mm-dd' (T2..CN). */
export const dowLabel = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  return DOW_LABELS[new Date(y, m - 1, d).getDay()];
};

/** Giờ 'HH:MM' từ ISO (giờ VN hiển thị theo locale máy). */
export const fmtTime = (iso?: string | null): string =>
  iso ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';

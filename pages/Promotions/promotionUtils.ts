import type { ProductCategory } from '@/types/category';
import type { Promotion } from '@/types/promotion';

/** '' / NaN → undefined; ngược lại số. */
export const num = (s: string): number | undefined => {
  const n = Number(s);
  return s.trim() === '' || Number.isNaN(n) ? undefined : n;
};

/** Chuỗi "a, b, c" → mảng id (bỏ rỗng). */
export const idList = (s: string): string[] =>
  s.split(',').map((x) => x.trim()).filter(Boolean);

/**
 * Về yyyy-mm-dd cho ô ngày (Input type date). apiClient hồi sinh chuỗi ISO
 * timestamptz thành object Timestamp-like (có .toDate()), nên giá trị ngày có
 * thể là string HOẶC object → xử lý cả hai.
 */
export const toDateInput = (v: unknown): string => {
  if (!v) return '';
  if (typeof v === 'string') return v.slice(0, 10);
  const d =
    typeof (v as any)?.toDate === 'function'
      ? (v as any).toDate()
      : typeof (v as any)?.toMillis === 'function'
        ? new Date((v as any).toMillis())
        : null;
  return d instanceof Date && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : '';
};

/** dd/mm/yyyy để hiển thị (nhận string ISO hoặc Timestamp-like). */
export const formatDateShort = (v: unknown): string => {
  const ymd = toDateInput(v);
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
};

/** Khoảng thời gian "dd/mm/yyyy – dd/mm/yyyy" (hoặc 1 đầu, hoặc rỗng). */
export const formatDateRange = (start: unknown, end: unknown): string => {
  const s = formatDateShort(start);
  const e = formatDateShort(end);
  if (s && e) return `${s} – ${e}`;
  if (s) return `Từ ${s}`;
  if (e) return `Đến ${e}`;
  return 'Không giới hạn thời gian';
};

/** yyyy-mm-dd hôm nay theo giờ local. */
export const todayYMD = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export type PromotionState = 'running' | 'ended' | 'off';

/**
 * Trạng thái hiệu lực của khuyến mãi:
 * - 'off'     : admin tắt (status=inactive)
 * - 'ended'   : ngày kết thúc đã qua HOẶC hết lượt (usedCount ≥ maxUses)
 * - 'running' : còn lại
 */
export const promotionState = (p: Promotion): PromotionState => {
  if (p.status === 'inactive') return 'off';
  const end = toDateInput(p.endAt);
  const endPassed = !!end && end < todayYMD();
  const usedUp = p.maxUses != null && p.maxUses > 0 && (p.usedCount || 0) >= p.maxUses;
  return endPassed || usedUp ? 'ended' : 'running';
};

/** Số lần chạy = runCount (BE tính) hoặc suy từ runs.length + 1. */
export const runsCount = (p: Promotion): number =>
  p.runCount ?? (p.runs?.length ?? 0) + 1;

/** Tên danh mục theo id (fallback về chính giá trị nếu không tìm thấy). */
export const categoryName = (
  categories: ProductCategory[],
  idOrName?: string | null,
): string => {
  if (!idOrName) return '';
  return categories.find((c) => c.id === idOrName || c.name === idOrName)?.name ?? idOrName;
};

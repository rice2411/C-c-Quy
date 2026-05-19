/**
 * Lưu danh sách productId đã add gần đây (localStorage) để hiển thị
 * "Sản phẩm hay dùng" trong empty state của OrderForm.
 *
 * Bakery thường có 5-10 món chủ lực chiếm phần lớn đơn → 1-click add
 * tiết kiệm rất nhiều thao tác.
 */

const STORAGE_KEY = 'cucquybakery:recent_products';
const MAX_RECENT = 8;

function safeGetStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function getRecentProductIds(): string[] {
  const ls = safeGetStorage();
  if (!ls) return [];
  try {
    const raw = ls.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string').slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

/**
 * Đẩy 1 product lên đầu list. Trùng → loại bỏ vị trí cũ rồi đẩy lên đầu.
 * Cắt list về tối đa MAX_RECENT.
 */
export function pushRecentProductId(productId: string): void {
  if (!productId) return;
  const ls = safeGetStorage();
  if (!ls) return;
  try {
    const current = getRecentProductIds().filter((id) => id !== productId);
    current.unshift(productId);
    const trimmed = current.slice(0, MAX_RECENT);
    ls.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore
  }
}

export function clearRecentProductIds(): void {
  const ls = safeGetStorage();
  if (!ls) return;
  try {
    ls.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

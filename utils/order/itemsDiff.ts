/**
 * Diff helper cho mảng OrderItem — phát hiện item nào được thêm/xoá/đổi qty/đổi giá.
 * Dùng cho Zalo notif khi sửa đơn để hiện cụ thể sản phẩm thay đổi.
 */
import type { OrderItem } from '@/types';
import { formatVND } from '@/utils/format/currencyUtil';

export interface ItemChangeEntry {
  /** Tên sản phẩm để hiển thị */
  name: string;
  /** Loại thay đổi */
  kind: 'added' | 'removed' | 'qty' | 'price' | 'qtyPrice';
  oldQty?: number;
  newQty?: number;
  oldPrice?: number;
  newPrice?: number;
}

/** Key dùng để match item giữa 2 phiên bản: ưu tiên productId, fallback name */
const itemKey = (it: OrderItem): string => (it.productId || it.id || it.name || '').trim().toLowerCase();

/**
 * So sánh 2 array items, trả về danh sách thay đổi cụ thể.
 */
export const diffOrderItems = (prev?: OrderItem[], next?: OrderItem[]): ItemChangeEntry[] => {
  const prevList = prev || [];
  const nextList = next || [];

  // Group by key (tránh duplicate khi 1 sản phẩm xuất hiện 2 dòng)
  const sumByKey = (list: OrderItem[]): Map<string, { name: string; qty: number; price: number }> => {
    const m = new Map<string, { name: string; qty: number; price: number }>();
    list.forEach((it) => {
      const k = itemKey(it);
      if (!k) return;
      const existing = m.get(k);
      if (existing) {
        existing.qty += it.quantity || 0;
        // Giá lấy giá mới nhất (nếu khác nhau, ưu tiên record cuối)
        existing.price = it.price || existing.price;
      } else {
        m.set(k, { name: it.name || k, qty: it.quantity || 0, price: it.price || 0 });
      }
    });
    return m;
  };

  const prevMap = sumByKey(prevList);
  const nextMap = sumByKey(nextList);
  const allKeys = new Set<string>([...prevMap.keys(), ...nextMap.keys()]);

  const changes: ItemChangeEntry[] = [];
  allKeys.forEach((k) => {
    const before = prevMap.get(k);
    const after = nextMap.get(k);

    if (!before && after) {
      changes.push({ name: after.name, kind: 'added', newQty: after.qty, newPrice: after.price });
      return;
    }
    if (before && !after) {
      changes.push({ name: before.name, kind: 'removed', oldQty: before.qty, oldPrice: before.price });
      return;
    }
    if (before && after) {
      const qtyChanged = before.qty !== after.qty;
      const priceChanged = before.price !== after.price;
      if (qtyChanged && priceChanged) {
        changes.push({
          name: after.name,
          kind: 'qtyPrice',
          oldQty: before.qty,
          newQty: after.qty,
          oldPrice: before.price,
          newPrice: after.price,
        });
      } else if (qtyChanged) {
        changes.push({
          name: after.name,
          kind: 'qty',
          oldQty: before.qty,
          newQty: after.qty,
          oldPrice: after.price,
          newPrice: after.price,
        });
      } else if (priceChanged) {
        changes.push({
          name: after.name,
          kind: 'price',
          oldQty: after.qty,
          newQty: after.qty,
          oldPrice: before.price,
          newPrice: after.price,
        });
      }
    }
  });

  return changes;
};

/**
 * Format itemsDiff thành string nhiều dòng cho Zalo message.
 *   • SP A: +2 → 5 (cộng thêm 3)
 *   • SP B: 3 → 2 (giảm 1)
 *   • SP C: 50,000đ → 55,000đ (giá)
 *   • SP D: 0 → 1 (mới thêm)
 *   • SP E: 4 → 0 (đã xoá)
 */
export const formatItemsDiff = (diff: ItemChangeEntry[]): string[] => {
  return diff.map((d) => {
    switch (d.kind) {
      case 'added':
        return `   ➕ ${d.name}: × ${d.newQty} (${formatVND(d.newPrice || 0)})`;
      case 'removed':
        return `   ❌ ${d.name}: bỏ × ${d.oldQty}`;
      case 'qty': {
        const delta = (d.newQty || 0) - (d.oldQty || 0);
        const sign = delta > 0 ? `+${delta}` : `${delta}`;
        return `   🔁 ${d.name}: × ${d.oldQty} → × ${d.newQty} (${sign})`;
      }
      case 'price':
        return `   💰 ${d.name}: ${formatVND(d.oldPrice || 0)} → ${formatVND(d.newPrice || 0)} (× ${d.newQty})`;
      case 'qtyPrice':
        return `   🔁 ${d.name}: × ${d.oldQty} → × ${d.newQty}, giá ${formatVND(d.oldPrice || 0)} → ${formatVND(d.newPrice || 0)}`;
      default:
        return `   • ${d.name}`;
    }
  });
};

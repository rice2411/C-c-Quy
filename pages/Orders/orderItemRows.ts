/**
 * buildOrderItemRows — tách item của đơn thành từng DÒNG kiểu sàn TMĐT (mỗi loại/vị/phần
 * 1 hàng, ảnh riêng). Dùng chung cho OrderItemsMini (order list) + ShareableOrderCard (ảnh gửi khách).
 *  - Tính giá theo vị (flavor pricing) → mỗi VỊ 1 hàng (ảnh vị).
 *  - Có size → mỗi SIZE/đơn vị 1 hàng (combo có units → mỗi đơn vị kèm vị riêng).
 *  - Còn lại → 1 hàng (ảnh sản phẩm).
 */
import type { OrderItem, Product } from '@/types';
import { groupFlavors, isMixFlavors, productUsesFlavorPricing, flavorImage, sizeImage, sizeCount } from '@/types';

export interface OrderItemRow {
  key: string;
  img?: string;
  name: string;
  meta: string[];
  qty: number;
}

/**
 * Tổng số lượng (cái/phần) của đơn — dùng cho "N món".
 * Ưu tiên sizeCounts (mỗi phần có qty, vd 21 bánh lẻ), rồi flavors (mỗi cái 1 vị),
 * cuối cùng mới tới quantity — vì đơn size/vị thường để quantity = 1.
 */
export const orderItemsTotalQty = (items: OrderItem[]): number =>
  (items ?? []).reduce((sum, it) => {
    if (it.sizeCounts && it.sizeCounts.length) {
      return sum + it.sizeCounts.reduce((s, sc) => s + (sc.qty || 0), 0);
    }
    // Mix (token, không phải vị cụ thể) → dùng quantity; còn lại mỗi vị 1 cái.
    if (it.flavors && it.flavors.length && !isMixFlavors(it.flavors)) return sum + it.flavors.length;
    return sum + (it.quantity || 0);
  }, 0);

/**
 * Nhãn số lượng đơn hiển thị trên card — rõ SỐ SẢN PHẨM vs SỐ CÁI:
 *   1 loại  → "N cái"        (vd 10 cái)
 *   ≥2 loại → "M SP · N cái" (vd 2 SP · 11 cái)
 * Thay cho "N món" cũ (gộp cái nhưng gọi là "món" → dễ nhầm khi đơn nhiều sản phẩm).
 */
export const orderItemsCountLabel = (items: OrderItem[]): string => {
  const list = items ?? [];
  const pieces = orderItemsTotalQty(list);
  const products = new Set(list.map((it) => it.productId || it.id)).size;
  return products > 1 ? `${products} SP · ${pieces} cái` : `${pieces} cái`;
};

export const buildOrderItemRows = (items: OrderItem[], products: Product[]): OrderItemRow[] => {
  return (items ?? []).flatMap((it) => {
    const product = products.find((p) => p.id === it.productId);
    const flavors = it.flavors ?? [];
    const flavorLine = groupFlavors(flavors).map((g) => (g.qty > 1 ? `${g.name} ×${g.qty}` : g.name)).join(', ');
    // Option gói (Hộp / Gói) → 1 chip meta, hiện ở cả order list + card chia sẻ.
    const packMeta = it.packagingOption ? [it.packagingOption] : [];

    // 1) Tính giá theo vị → mỗi vị 1 hàng (ảnh vị). Mix thì KHÔNG tách (bếp tự phối).
    if (product && productUsesFlavorPricing(product) && flavors.length > 0 && !isMixFlavors(flavors)) {
      return groupFlavors(flavors).map(({ name: fl, qty }) => ({
        key: `${it.id}-f-${fl}`,
        img: flavorImage(product, fl) || it.image || product.image,
        name: it.name,
        meta: [`Vị: ${fl}`, ...packMeta],
        qty,
      }));
    }

    // 2) Có size → mỗi size 1 hàng.
    const sizeList = it.sizeCounts && it.sizeCounts.length
      ? it.sizeCounts
      : it.size ? [{ name: it.size, qty: it.quantity || 1 }] : null;

    if (sizeList) {
      return sizeList.flatMap((sc) => {
        const cnt = product ? (sizeCount(product, sc.name) ?? 1) : 1;
        const isCombo = cnt > 1;
        const sizeLbl = sc.name;
        const img = (product ? sizeImage(product, sc.name) : undefined) || it.image || product?.image;
        if (sc.units && sc.units.length) {
          // Combo THẬT (mỗi phần nhiều cái) → GỘP các phần GIỐNG NHAU (cùng bộ vị) thành
          // 1 hàng ×N; chỉ tách hàng khi phần có bộ vị khác nhau. (Trước: liệt kê #1..#N.)
          if (isCombo) {
            const groups: { fl: string; count: number }[] = [];
            sc.units.forEach((unit) => {
              const fl = groupFlavors(unit).map((g) => (g.qty > 1 ? `${g.name} ×${g.qty}` : g.name)).join(', ');
              const ex = groups.find((g) => g.fl === fl);
              if (ex) ex.count += 1;
              else groups.push({ fl, count: 1 });
            });
            return groups.map(({ fl, count }, gi) => {
              const meta = [sizeLbl];
              if (fl) meta.push(`Vị: ${fl}`);
              meta.push(...packMeta);
              return { key: `${it.id}-s-${sc.name}-g${gi}`, img, name: it.name, meta, qty: count };
            });
          }
          // Đơn lẻ (mỗi phần 1 cái) → GỘP tất cả vị vào 1 hàng, không liệt kê từng cái.
          const fl = groupFlavors(sc.units.flat())
            .map((g) => (g.qty > 1 ? `${g.name} ×${g.qty}` : g.name)).join(', ');
          const meta = [sizeLbl];
          if (fl) meta.push(`Vị: ${fl}`);
          meta.push(...packMeta);
          return [{ key: `${it.id}-s-${sc.name}`, img, name: it.name, meta, qty: sc.units.length }];
        }
        const label = sc.qty > 1 ? `${sizeLbl} ×${sc.qty}` : sizeLbl;
        const meta = [label];
        if (!isCombo && flavorLine) meta.push(`Vị: ${flavorLine}`);
        meta.push(...packMeta);
        return [{ key: `${it.id}-s-${sc.name}`, img, name: it.name, meta, qty: sc.qty }];
      });
    }

    // 3) Mặc định 1 hàng.
    const meta: string[] = [];
    if (flavorLine) meta.push(`Vị: ${flavorLine}`);
    meta.push(...packMeta);
    return [{ key: it.id, img: it.image || product?.image, name: it.name || '', meta, qty: it.quantity || 0 }];
  });
};

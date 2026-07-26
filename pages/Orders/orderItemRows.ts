/**
 * buildOrderItemRows — tách item của đơn thành từng DÒNG kiểu sàn TMĐT (mỗi loại/vị/phần
 * 1 hàng, ảnh riêng). Dùng chung cho OrderItemsMini (order list) + ShareableOrderCard (ảnh gửi khách).
 *  - Tính giá theo vị (flavor pricing) → mỗi VỊ 1 hàng (ảnh vị).
 *  - Có size → mỗi SIZE/đơn vị 1 hàng (combo có units → mỗi đơn vị kèm vị riêng).
 *  - Còn lại → 1 hàng (ảnh sản phẩm).
 */
import type { OrderItem, Product } from '@/types';
import { groupFlavors, productUsesFlavorPricing, flavorImage, sizeImage, sizeCount } from '@/types';

export interface OrderItemRow {
  key: string;
  img?: string;
  name: string;
  meta: string[];
  qty: number;
}

export const buildOrderItemRows = (items: OrderItem[], products: Product[]): OrderItemRow[] => {
  return (items ?? []).flatMap((it) => {
    const product = products.find((p) => p.id === it.productId);
    const flavors = it.flavors ?? [];
    const flavorLine = groupFlavors(flavors).map((g) => (g.qty > 1 ? `${g.name} ×${g.qty}` : g.name)).join(', ');
    // Option gói (Hộp / Gói) → 1 chip meta, hiện ở cả order list + card chia sẻ.
    const packMeta = it.packagingOption ? [it.packagingOption] : [];

    // 1) Tính giá theo vị → mỗi vị 1 hàng (ảnh vị).
    if (product && productUsesFlavorPricing(product) && flavors.length > 0) {
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
          // Combo THẬT (mỗi phần nhiều cái) → mỗi phần 1 hàng riêng (#index + vị của phần).
          if (isCombo) {
            return sc.units.map((unit, u) => {
              const fl = groupFlavors(unit).map((g) => (g.qty > 1 ? `${g.name} ×${g.qty}` : g.name)).join(', ');
              const meta = [`${sizeLbl}${sc.qty > 1 ? ` #${u + 1}` : ''}`];
              if (fl) meta.push(`Vị: ${fl}`);
              meta.push(...packMeta);
              return { key: `${it.id}-s-${sc.name}-${u}`, img, name: it.name, meta, qty: 1 };
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

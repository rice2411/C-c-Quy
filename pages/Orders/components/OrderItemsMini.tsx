/**
 * OrderItemsMini — danh sách item của đơn kiểu sàn TMĐT: mỗi LOẠI 1 hàng riêng, ảnh riêng,
 * KHÔNG gộp. Quy tắc tách:
 *  - Sản phẩm tính giá theo vị (flavor pricing) → mỗi VỊ 1 hàng (ảnh của vị).
 *  - Sản phẩm có size → mỗi SIZE 1 hàng: combo (count>1) hiện ẢNH COMBO; lẻ hiện VỊ.
 *  - Còn lại → 1 hàng (ảnh sản phẩm).
 */
import React from 'react';
import type { OrderItem } from '@/types';
import { groupFlavors, productUsesFlavorPricing, flavorImage, sizeImage, sizeCount } from '@/types';
import { useProducts } from '@/hooks/queries/useProductsQuery';
import Box from '@/components/ui/Box';
import Image from '@/components/ui/Image';
import Typography from '@/components/ui/Typography';

interface MiniRow {
  key: string;
  img?: string;
  name: string;
  meta: string[];
  qty: number;
}

const OrderItemsMini: React.FC<{ items: OrderItem[] }> = ({ items }) => {
  const { products } = useProducts();

  if (!items || items.length === 0) {
    return <Typography as="span" size="xs" variant="muted">—</Typography>;
  }

  const rows: MiniRow[] = items.flatMap((it) => {
    const product = products.find((p) => p.id === it.productId);
    const flavors = it.flavors ?? [];
    const flavorLine = groupFlavors(flavors).map((g) => (g.qty > 1 ? `${g.name} ×${g.qty}` : g.name)).join(', ');

    // 1) Tính giá theo vị → mỗi vị 1 hàng (ảnh vị).
    if (product && productUsesFlavorPricing(product) && flavors.length > 0) {
      return groupFlavors(flavors).map(({ name: fl, qty }) => ({
        key: `${it.id}-f-${fl}`,
        img: flavorImage(product, fl) || it.image,
        name: it.name,
        meta: [`Vị: ${fl}`],
        qty,
      }));
    }

    // 2) Có nhiều size → mỗi size 1 hàng.
    const sizeList = it.sizeCounts && it.sizeCounts.length
      ? it.sizeCounts
      : it.size ? [{ name: it.size, qty: it.quantity || 1 }] : null;

    if (sizeList) {
      return sizeList.map(({ name: sizeName, qty }) => {
        const cnt = product ? (sizeCount(product, sizeName) ?? 1) : 1;
        const isCombo = cnt > 1;
        const sizeLbl = isCombo ? `${sizeName} (${cnt} cái)` : sizeName;
        const label = qty > 1 ? `${sizeLbl} ×${qty}` : sizeLbl;
        const meta = [label];
        // Lẻ → hiện vị; combo → chỉ ảnh combo (không liệt kê vị).
        if (!isCombo && flavorLine) meta.push(`Vị: ${flavorLine}`);
        const img = (product ? sizeImage(product, sizeName) : undefined) || it.image;
        return { key: `${it.id}-s-${sizeName}`, img, name: it.name, meta, qty };
      });
    }

    // 3) Mặc định 1 hàng.
    const meta: string[] = [];
    if (flavorLine) meta.push(`Vị: ${flavorLine}`);
    return [{ key: it.id, img: it.image, name: it.name || '', meta, qty: it.quantity || 0 }];
  });

  return (
    <Box layoutClassName="flex flex-col gap-2">
      {rows.map((r) => (
        <Box key={r.key} layoutClassName="flex items-start gap-2.5">
          <Box
            layoutClassName="h-10 w-10 shrink-0 overflow-hidden"
            roundedClassName="rounded-md"
            borderClassName="border border-slate-200 dark:border-slate-700">
            <Image src={r.img} alt={r.name} layoutClassName="h-full w-full bg-slate-100 object-cover dark:bg-slate-800" />
          </Box>
          <Box layoutClassName="min-w-0 flex-1">
            <Typography as="p" size="xs" layoutClassName="font-medium leading-snug" textClassName="text-slate-800 dark:text-slate-200">
              {r.name}
            </Typography>
            {r.meta.map((m, i) => (
              <Typography key={i} as="p" size="xs" layoutClassName="leading-snug" textClassName="text-slate-500 dark:text-slate-400">
                {m}
              </Typography>
            ))}
          </Box>
          <Typography as="span" size="xs" layoutClassName="shrink-0 font-medium" textClassName="text-slate-500 dark:text-slate-400">
            ×{r.qty}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default OrderItemsMini;

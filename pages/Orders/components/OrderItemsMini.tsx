/**
 * OrderItemsMini — danh sách mini từng item của đơn (thumbnail + tên + size/vị + ×SL).
 * Dùng trong order list (desktop/mobile) để thấy đầy đủ sản phẩm khách đặt.
 *
 * Sản phẩm tính giá theo vị + nhiều vị → TÁCH mỗi vị 1 dòng riêng (ảnh của vị đó),
 * không gộp hết vào 1 dòng — khớp cách hiển thị ở OrderDetail.
 */
import React from 'react';
import type { OrderItem } from '@/types';
import { groupFlavors, sizeCountsLabel, productUsesFlavorPricing } from '@/types';
import { useProducts } from '@/hooks/queries/useProductsQuery';
import Box from '@/components/ui/Box';
import Image from '@/components/ui/Image';
import Typography from '@/components/ui/Typography';

interface MiniRow {
  key: string;
  img?: string;
  text: string;
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
    // Combo tính giá theo vị → mỗi vị 1 dòng, ảnh riêng của vị.
    if (product && productUsesFlavorPricing(product) && flavors.length > 0) {
      return groupFlavors(flavors).map(({ name: fl, qty }) => {
        const variant = product.flavorVariants?.find((v) => v.name === fl);
        return { key: `${it.id}-${fl}`, img: variant?.image || it.image, text: `${it.name} · ${fl}`, qty };
      });
    }
    // Mặc định: 1 dòng (tên + size + vị gọn).
    let s = it.name || '';
    const scLabel = sizeCountsLabel(it.sizeCounts);
    if (scLabel) s += ` · ${scLabel}`;
    else if (it.size) s += ` · ${it.size}`;
    const ft = groupFlavors(flavors).map((g) => (g.qty > 1 ? `${g.name} ×${g.qty}` : g.name)).join(', ');
    if (ft) s += ` (${ft})`;
    return [{ key: it.id, img: it.image, text: s, qty: it.quantity || 0 }];
  });

  return (
    <Box layoutClassName="flex flex-col gap-1">
      {rows.map((r) => (
        <Box key={r.key} layoutClassName="flex items-center gap-2">
          <Box
            layoutClassName="h-7 w-7 shrink-0 overflow-hidden"
            roundedClassName="rounded-md"
            borderClassName="border border-slate-200 dark:border-slate-700">
            <Image src={r.img} alt={r.text} layoutClassName="h-full w-full bg-slate-100 object-cover dark:bg-slate-800" />
          </Box>
          <Typography as="span" size="xs" layoutClassName="min-w-0 flex-1 truncate" textClassName="text-slate-600 dark:text-slate-300">
            {r.text}
          </Typography>
          <Typography as="span" size="xs" layoutClassName="shrink-0 font-medium" textClassName="text-slate-500 dark:text-slate-400">
            ×{r.qty}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default OrderItemsMini;

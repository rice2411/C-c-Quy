/**
 * OrderItemsMini — danh sách item của đơn kiểu sàn TMĐT (Shopee/Lazada):
 * mỗi sản phẩm 1 hàng gồm [ảnh] [tên + phân loại xuống dòng phụ] [×SL].
 * Tên và phân loại (size / vị) tách dòng, KHÔNG dồn hết vào 1 dòng cụt.
 *
 * Combo tính giá theo vị + nhiều vị → tách mỗi vị 1 hàng (ảnh của vị đó).
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
  name: string;
  meta: string[]; // dòng phụ: size, vị...
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
    // Combo tính giá theo vị → mỗi vị 1 hàng, ảnh riêng của vị.
    if (product && productUsesFlavorPricing(product) && flavors.length > 0) {
      return groupFlavors(flavors).map(({ name: fl, qty }) => {
        const variant = product.flavorVariants?.find((v) => v.name === fl);
        return { key: `${it.id}-${fl}`, img: variant?.image || it.image, name: it.name, meta: [`Vị: ${fl}`], qty };
      });
    }
    const meta: string[] = [];
    const scLabel = sizeCountsLabel(it.sizeCounts);
    if (scLabel) meta.push(scLabel);
    else if (it.size) meta.push(it.size);
    const ft = groupFlavors(flavors).map((g) => (g.qty > 1 ? `${g.name} ×${g.qty}` : g.name)).join(', ');
    if (ft) meta.push(`Vị: ${ft}`);
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

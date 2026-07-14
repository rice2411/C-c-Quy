/**
 * OrderItemsMini — danh sách item của đơn kiểu sàn TMĐT: mỗi LOẠI 1 hàng riêng, ảnh riêng,
 * KHÔNG gộp. Quy tắc tách:
 *  - Sản phẩm tính giá theo vị (flavor pricing) → mỗi VỊ 1 hàng (ảnh của vị).
 *  - Sản phẩm có size → mỗi SIZE 1 hàng: combo (count>1) hiện ẢNH COMBO; lẻ hiện VỊ.
 *  - Còn lại → 1 hàng (ảnh sản phẩm).
 */
import React from 'react';
import type { OrderItem } from '@/types';
import { useProducts } from '@/hooks/queries/useProductsQuery';
import { buildOrderItemRows } from '@/pages/Orders/orderItemRows';
import Box from '@/components/ui/Box';
import Image from '@/components/ui/Image';
import Typography from '@/components/ui/Typography';

const OrderItemsMini: React.FC<{ items: OrderItem[] }> = ({ items }) => {
  const { products } = useProducts();

  if (!items || items.length === 0) return null;

  const rows = buildOrderItemRows(items, products);

  // Chỉ hiện khi có ≥2 dòng (nhiều sản phẩm HOẶC 1 sản phẩm nhiều combo/loại).
  // Đơn 1 dòng → ẩn (đã có ảnh bìa + "N món" đại diện).
  if (rows.length < 2) return null;

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

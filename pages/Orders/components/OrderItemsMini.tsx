/**
 * OrderItemsMini — danh sách mini từng item của đơn (thumbnail + tên + size/vị + ×SL).
 * Dùng trong order list (desktop/mobile) để thấy đầy đủ sản phẩm khách đặt.
 */
import React from 'react';
import type { OrderItem } from '@/types';
import Box from '@/components/ui/Box';
import Image from '@/components/ui/Image';
import Typography from '@/components/ui/Typography';

const label = (it: OrderItem): string => {
  let s = it.name || '';
  if (it.size) s += ` · ${it.size}`;
  if (it.flavors && it.flavors.length) s += ` (${it.flavors.join(', ')})`;
  return s;
};

const OrderItemsMini: React.FC<{ items: OrderItem[] }> = ({ items }) => {
  if (!items || items.length === 0) {
    return <Typography as="span" size="xs" variant="muted">—</Typography>;
  }
  return (
    <Box layoutClassName="flex flex-col gap-1">
      {items.map((it) => (
        <Box key={it.id} layoutClassName="flex items-center gap-2">
          <Box
            layoutClassName="h-7 w-7 shrink-0 overflow-hidden"
            roundedClassName="rounded-md"
            borderClassName="border border-slate-200 dark:border-slate-700">
            <Image src={it.image} alt={it.name} layoutClassName="h-full w-full bg-slate-100 object-cover dark:bg-slate-800" />
          </Box>
          <Typography as="span" size="xs" layoutClassName="min-w-0 flex-1 truncate" textClassName="text-slate-600 dark:text-slate-300">
            {label(it)}
          </Typography>
          <Typography as="span" size="xs" layoutClassName="shrink-0 font-medium" textClassName="text-slate-500 dark:text-slate-400">
            ×{it.quantity || 0}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default OrderItemsMini;

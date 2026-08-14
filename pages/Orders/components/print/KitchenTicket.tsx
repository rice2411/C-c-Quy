import React from 'react';
import { Order } from '@/types';
import { useProducts } from '@/hooks/queries/useProductsQuery';
import { buildOrderItemRows } from '@/pages/Orders/orderItemRows';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';
import Heading from '@/components/ui/Heading';

export interface KitchenTicketProps {
  order: Order;
}

/**
 * Phiếu ORDER cho BẾP — khổ 58mm, CHỮ TO, KHÔNG giá/QR. Nổi bật mã đơn + giờ cần giao +
 * số lượng từng món để bếp làm nhanh. Đen trắng (chỉ class light).
 */
const KitchenTicket: React.FC<KitchenTicketProps> = ({ order }) => {
  const { products } = useProducts();
  const itemRows = buildOrderItemRows(order.items, products);
  const c = order.customer;

  const orderedAt = new Date(order.date || Date.now()).toLocaleString('vi-VN');
  const deliverAt = order.deliveryDate
    ? `${new Date(order.deliveryDate).toLocaleDateString('vi-VN')}${order.deliveryTime ? ` · ${order.deliveryTime}` : ''}`
    : '';

  return (
    <Box layoutClassName="w-full px-0 py-1 leading-tight" backgroundClassName="bg-white" textClassName="text-black">
      {/* Header */}
      <Box layoutClassName="text-center border-b-2 border-black pb-1">
        <Heading level={3} layoutClassName="text-[30px] font-extrabold uppercase" textClassName="text-black">Phiếu bếp</Heading>
        <Typography as="p" layoutClassName="text-[27px] font-mono font-extrabold" textClassName="text-black">{order.orderNumber || order.id}</Typography>
      </Box>

      {/* Giờ + khách */}
      <Box layoutClassName="py-1 space-y-0.5">
        <Typography as="p" layoutClassName="text-[20px]" textClassName="text-black">Đặt lúc: {orderedAt}</Typography>
        {deliverAt ? (
          <Box layoutClassName="border-2 border-black px-1 py-0.5 my-0.5">
            <Typography as="p" layoutClassName="text-[26px] font-extrabold text-center" textClassName="text-black">⏰ GIAO: {deliverAt}</Typography>
          </Box>
        ) : null}
        <Typography as="p" layoutClassName="text-[22px] font-semibold" textClassName="text-black">Khách: {c?.name || '—'}{c?.phone ? ` · ${c.phone}` : ''}</Typography>
      </Box>

      {/* Món — chữ to, có SL lớn */}
      <Box layoutClassName="border-t-2 border-black pt-1 space-y-1.5">
        {itemRows.map((r) => (
          <Box key={r.key} layoutClassName="flex items-start justify-between gap-2 border-b border-dashed border-black pb-1">
            <Box layoutClassName="min-w-0 flex-1">
              <Typography as="p" layoutClassName="text-[28px] font-extrabold leading-tight" textClassName="text-black">{r.name}</Typography>
              {r.meta.map((m, i) => (
                <Typography key={i} as="p" layoutClassName="text-[22px] font-medium leading-tight" textClassName="text-black">• {m}</Typography>
              ))}
            </Box>
            <Typography as="span" layoutClassName="shrink-0 text-[34px] font-extrabold leading-none" textClassName="text-black">×{r.qty}</Typography>
          </Box>
        ))}
      </Box>

      {/* Ghi chú đơn */}
      {order.note ? (
        <Box layoutClassName="border-2 border-black px-1 py-1 mt-1">
          <Typography as="p" layoutClassName="text-[20px] font-bold uppercase" textClassName="text-black">Ghi chú</Typography>
          <Typography as="p" layoutClassName="text-[26px] font-semibold" textClassName="text-black">{order.note}</Typography>
        </Box>
      ) : null}
    </Box>
  );
};

export default KitchenTicket;

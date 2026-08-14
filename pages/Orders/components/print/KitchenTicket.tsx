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
      {/* Header — nhẹ: bớt đậm/nhỏ lại để giảm mực đen (chống rớt USB), vẫn rõ */}
      <Box layoutClassName="text-center border-b border-black pb-1">
        <Heading level={3} layoutClassName="text-[19px] font-semibold uppercase" textClassName="text-black">Phiếu bếp</Heading>
        <Typography as="p" layoutClassName="text-[18px] font-mono font-semibold" textClassName="text-black">{order.orderNumber || order.id}</Typography>
      </Box>

      {/* Giờ + khách */}
      <Box layoutClassName="py-1 space-y-0.5">
        <Typography as="p" layoutClassName="text-[13px]" textClassName="text-black">Đặt lúc: {orderedAt}</Typography>
        {deliverAt ? (
          <Box layoutClassName="border border-black px-1 py-0.5 my-0.5">
            <Typography as="p" layoutClassName="text-[17px] font-semibold text-center" textClassName="text-black">⏰ GIAO: {deliverAt}</Typography>
          </Box>
        ) : null}
        <Typography as="p" layoutClassName="text-[14px] font-medium" textClassName="text-black">Khách: {c?.name || '—'}{c?.phone ? ` · ${c.phone}` : ''}</Typography>
      </Box>

      {/* Món — vẫn rõ SL nhưng nhẹ mực */}
      <Box layoutClassName="border-t border-black pt-1 space-y-1">
        {itemRows.map((r) => (
          <Box key={r.key} layoutClassName="flex items-start justify-between gap-2 border-b border-dashed border-black pb-1">
            <Box layoutClassName="min-w-0 flex-1">
              <Typography as="p" layoutClassName="text-[18px] font-semibold leading-tight" textClassName="text-black">{r.name}</Typography>
              {r.meta.map((m, i) => (
                <Typography key={i} as="p" layoutClassName="text-[13px] font-normal leading-tight" textClassName="text-black">• {m}</Typography>
              ))}
            </Box>
            <Typography as="span" layoutClassName="shrink-0 text-[22px] font-bold leading-none" textClassName="text-black">×{r.qty}</Typography>
          </Box>
        ))}
      </Box>

      {/* Ghi chú đơn */}
      {order.note ? (
        <Box layoutClassName="border border-black px-1 py-1 mt-1">
          <Typography as="p" layoutClassName="text-[12px] font-semibold uppercase" textClassName="text-black">Ghi chú</Typography>
          <Typography as="p" layoutClassName="text-[15px] font-medium" textClassName="text-black">{order.note}</Typography>
        </Box>
      ) : null}
    </Box>
  );
};

export default KitchenTicket;

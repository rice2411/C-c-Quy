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
    <Box layoutClassName="w-full px-0 py-0.5 leading-none" backgroundClassName="bg-white" textClassName="text-black">
      {/* Header — font vừa, siết spacing để ảnh gọn (bù chữ to, mực không tăng) */}
      <Box layoutClassName="text-center border-b border-black pb-0.5">
        <Heading level={3} layoutClassName="text-[33px] font-semibold uppercase" textClassName="text-black">Phiếu bếp</Heading>
        <Typography as="p" layoutClassName="text-[31px] font-mono font-semibold" textClassName="text-black">{order.orderNumber || order.id}</Typography>
      </Box>

      {/* Giờ + khách */}
      <Box layoutClassName="py-0.5">
        <Typography as="p" layoutClassName="text-[25px]" textClassName="text-black">Đặt lúc: {orderedAt}</Typography>
        {deliverAt ? (
          <Box layoutClassName="border border-black px-1 py-0.5 my-0.5">
            <Typography as="p" layoutClassName="text-[30px] font-semibold text-center" textClassName="text-black">⏰ GIAO: {deliverAt}</Typography>
          </Box>
        ) : null}
        <Typography as="p" layoutClassName="text-[26px] font-medium" textClassName="text-black">Khách: {c?.name || '—'}{c?.phone ? ` · ${c.phone}` : ''}</Typography>
      </Box>

      {/* Món — SL nổi bật */}
      <Box layoutClassName="border-t border-black pt-0.5 space-y-0.5">
        {itemRows.map((r) => (
          <Box key={r.key} layoutClassName="flex items-start justify-between gap-2 border-b border-dashed border-black pb-0.5">
            <Box layoutClassName="min-w-0 flex-1">
              <Typography as="p" layoutClassName="text-[32px] font-semibold leading-tight" textClassName="text-black">{r.name}</Typography>
              {r.meta.map((m, i) => (
                <Typography key={i} as="p" layoutClassName="text-[25px] font-normal leading-tight" textClassName="text-black">• {m}</Typography>
              ))}
            </Box>
            <Typography as="span" layoutClassName="shrink-0 text-[36px] font-bold leading-none" textClassName="text-black">×{r.qty}</Typography>
          </Box>
        ))}
      </Box>

      {/* Ghi chú đơn */}
      {order.note ? (
        <Box layoutClassName="border border-black px-1 py-0.5 mt-0.5">
          <Typography as="p" layoutClassName="text-[24px] font-semibold uppercase" textClassName="text-black">Ghi chú</Typography>
          <Typography as="p" layoutClassName="text-[27px] font-medium" textClassName="text-black">{order.note}</Typography>
        </Box>
      ) : null}
    </Box>
  );
};

export default KitchenTicket;

import React from 'react';
import { Order } from '@/types';
import { orderCarrier } from '@/types/order';
import Badge from '@/components/ui/Badge';

interface CarrierBadgeProps {
  order: Order;
}

/**
 * Badge đơn vị vận chuyển cạnh tên KH ở list đơn.
 * SPX (ship tỉnh / có mã VĐ SPX) → "Shopee" nền cam chữ trắng;
 * mặc định (Cúc Quý tự giao) → "Cúc Quý" nền primary chữ trắng.
 */
const CarrierBadge: React.FC<CarrierBadgeProps> = ({ order }) => {
  const isSpx = orderCarrier(order) === 'SPX';
  return (
    <Badge
      size="sm"
      layoutClassName="inline-flex shrink-0 items-center px-2 py-0.5 text-[11px] font-bold"
      borderClassName="border-transparent"
      backgroundClassName={isSpx ? 'bg-[#ee4d2d]' : 'bg-primary-600 dark:bg-primary-500'}
      textClassName="text-white"
    >
      {isSpx ? 'Shopee' : 'Cúc Quý'}
    </Badge>
  );
};

export default CarrierBadge;

import React, { useMemo } from 'react';
import { Bus, Truck } from 'lucide-react';
import { Order } from '@/types';
import { orderCarrier } from '@/types/order';
import { useCarriers } from '@/hooks/queries/useCarriersQuery';
import Badge from '@/components/ui/Badge';

interface CarrierBadgeProps {
  order: Order;
}

type BadgeStyle = { label: string; bg: string; coach?: boolean };

/** Map tên hãng chuyển phát → nhãn ngắn + màu brand. */
const expressStyle = (name: string): BadgeStyle => {
  const n = name.toLowerCase();
  if (n.includes('shopee') || n.includes('spx')) return { label: 'Shopee', bg: 'bg-[#ee4d2d]' };
  if (n.includes('viettel')) return { label: 'Viettel', bg: 'bg-[#ee0033]' };
  if (n.includes('j&t') || n.includes('jt ')) return { label: 'J&T', bg: 'bg-[#d92b2b]' };
  if (n.includes('giao hàng nhanh') || n.includes('ghn')) return { label: 'GHN', bg: 'bg-[#f57c00]' };
  if (n.includes('tiết kiệm') || n.includes('ghtk')) return { label: 'GHTK', bg: 'bg-[#17a04a]' };
  if (n.includes('ninja')) return { label: 'Ninja Van', bg: 'bg-[#d0021b]' };
  if (n.includes('best')) return { label: 'BEST', bg: 'bg-[#f5a623]' };
  if (n.includes('vnpost') || n.includes('vietnam post') || n.includes('bưu điện')) return { label: 'VNPost', bg: 'bg-[#c8102e]' };
  if (n.includes('ahamove')) return { label: 'Ahamove', bg: 'bg-[#f7c600]' };
  if (n.includes('grab')) return { label: 'Grab', bg: 'bg-[#00b14f]' };
  // Hãng lạ: lấy tối đa 12 ký tự đầu của tên làm nhãn.
  return { label: name.length > 12 ? `${name.slice(0, 12)}…` : name, bg: 'bg-slate-600 dark:bg-slate-500' };
};

/**
 * Badge đơn vị vận chuyển cạnh tên KH ở list đơn.
 * Ưu tiên hãng THẬT gắn trên đơn (carrierId): chuyển phát → nhãn brand (Shopee/Viettel…);
 * nhà xe (coach) → "Xe khách" (nền cam, icon xe buýt).
 * Đơn chưa gắn hãng → suy cũ: SPX (ship tỉnh/mã SPX) → "Shopee", còn lại → "Cúc Quy".
 */
const CarrierBadge: React.FC<CarrierBadgeProps> = ({ order }) => {
  const { carriers } = useCarriers();

  const style = useMemo<BadgeStyle>(() => {
    const carrier = order.carrierId ? carriers.find((c) => c.id === order.carrierId) : undefined;
    if (carrier) {
      if (carrier.type === 'coach') return { label: 'Xe khách', bg: 'bg-amber-500', coach: true };
      return expressStyle(carrier.name);
    }
    // Fallback đơn chưa gắn hãng.
    if (orderCarrier(order) === 'SPX') return { label: 'Shopee', bg: 'bg-[#ee4d2d]' };
    return { label: 'Cúc Quy', bg: 'bg-primary-600 dark:bg-primary-500' };
  }, [order, carriers]);

  return (
    <Badge
      size="sm"
      layoutClassName="inline-flex shrink-0 items-center gap-1 px-2 py-0.5 text-[11px] font-bold"
      borderClassName="border-transparent"
      backgroundClassName={style.bg}
      textClassName="text-white"
    >
      {style.coach ? <Bus className="h-3 w-3" /> : <Truck className="h-3 w-3" />}
      {style.label}
    </Badge>
  );
};

export default CarrierBadge;

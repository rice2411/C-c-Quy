import React from 'react';
import { CalendarDays, ChevronRight, Globe, MapPin, Package, Phone, Store, User } from 'lucide-react';
import { PAYMENT_STATUS_COLORS, STATUS_COLORS } from '@/constant/order';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSurchargeTags } from '@/hooks/queries/useSurchargeTagsQuery';
import { orderAddressFallbackKey, surchargeTagLabel } from '@/types/order';
import { Order } from '@/types';
import { DeliveryType } from '@/types/enums';

const isFreeShip = (order: Order) => {
  if (order.shippingCost && order.shippingCost > 0) return false;
  if (order.deliveryType === DeliveryType.PICKUP) return false;
  if (order.deliveryType === DeliveryType.SHIP || order.deliveryType === DeliveryType.SHIP_PROVINCE) return true;
  return !!order.customer?.address;
};
import { formatVND } from '@/utils/format/currencyUtil';
import { buildDeliveryBadge } from '@/utils/order/deliveryDateBadge';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import OrderItemsMini from '@/pages/Orders/components/OrderItemsMini';

interface OrderListMobileProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  renderProductSummary: (order: Order) => React.ReactNode;
}

const OrderListMobile: React.FC<OrderListMobileProps> = ({ orders, onSelectOrder }) => {
  const { t } = useLanguage();
  const { surchargeTags } = useSurchargeTags();

  const getItemCount = (order: Order) =>
    order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

  const getOrderImage = (order: Order) =>
    order.items?.[0]?.image ||
    `https://placehold.co/200x200?text=${encodeURIComponent(order.items?.[0]?.name || 'Order')}`;

  return (
    <Box
      layoutClassName="flex-1 overflow-y-auto lg:hidden"
      backgroundClassName="bg-slate-50/50 dark:bg-slate-900/50"
    >
      <Box layoutClassName="space-y-3 p-3">
      {orders.length > 0 ? (
        orders.map((order) => {
          const dlv = buildDeliveryBadge(order.deliveryDate, { status: order.status });
          return (
            <Card
              key={order.id}
              padding="none"
              layoutClassName={`relative cursor-pointer overflow-hidden transition-all active:scale-[0.99] ${dlv.cardClass} ${order.isTest ? 'ring-2 ring-amber-400 ring-offset-1 dark:ring-amber-500 dark:ring-offset-slate-900' : ''}`}
              borderClassName=""
              backgroundClassName=""
              onClick={() => onSelectOrder(order)}
            >
              {/* TEST RIBBON — chỉ hiện với đơn test */}
              {order.isTest ? (
                <Box
                  layoutClassName="flex items-center justify-center gap-1 border-b border-amber-200 bg-amber-100 px-3 py-1 text-amber-900 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-100"
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest">🧪 Đơn hàng test</span>
                </Box>
              ) : null}
              {/* HERO STRIP — delivery date countdown, màu theo độ khẩn */}
              <Box
                layoutClassName={`flex items-center justify-between gap-2 border-b px-4 py-2.5 ${dlv.stripClass}`}
              >
                <Box layoutClassName="flex min-w-0 items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0" />
                  <Box layoutClassName="min-w-0">
                    <Typography
                      as="div"
                      size="sm"
                      layoutClassName="truncate text-[15px] font-bold leading-tight"
                    >
                      {dlv.label}
                    </Typography>
                    <Typography as="div" size="xs" layoutClassName="truncate opacity-80">
                      {dlv.sublabel}
                      {order.deliveryTime ? ` · ${order.deliveryTime}` : ''}
                    </Typography>
                  </Box>
                </Box>
                <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />
              </Box>

              {/* Body: image | customer info */}
              <Box layoutClassName="grid grid-cols-[80px_1fr] gap-3 p-3">
                <Box
                  layoutClassName="h-20 w-20 shrink-0 overflow-hidden"
                  roundedClassName="rounded-lg"
                  borderClassName="border border-slate-200 dark:border-slate-600"
                  shadowClassName="shadow-sm"
                >
                  <img
                    src={getOrderImage(order)}
                    alt={order.items?.[0]?.name || 'Order'}
                    className="h-full w-full object-cover"
                  />
                </Box>
                <Box layoutClassName="min-w-0">
                  <Box layoutClassName="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <Typography
                      as="div"
                      size="base"
                      layoutClassName="truncate text-[16px] font-bold leading-tight"
                      textClassName="text-slate-900 dark:text-slate-50"
                    >
                      {order.customer?.name || '—'}
                    </Typography>
                  </Box>
                  {order.customer?.phone ? (
                    <a
                      href={`tel:${order.customer.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blue-600 active:underline dark:text-blue-400"
                    >
                      <Phone className="h-3 w-3" />
                      {order.customer.phone}
                    </a>
                  ) : null}
                  {order.customer?.address ? (
                    <Box layoutClassName="mt-1 flex items-start gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                      <Typography as="span" layoutClassName="line-clamp-1">
                        {order.customer.address}
                      </Typography>
                    </Box>
                  ) : (
                    <Box layoutClassName="mt-1 flex items-start gap-1 text-xs text-slate-500 dark:text-slate-400">
                      {order.deliveryType === DeliveryType.PICKUP ? (
                        <Store className="mt-0.5 h-3 w-3 shrink-0" />
                      ) : order.deliveryType === DeliveryType.SHIP_PROVINCE ? (
                        <Globe className="mt-0.5 h-3 w-3 shrink-0" />
                      ) : (
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                      )}
                      <Typography as="span" layoutClassName="line-clamp-1">
                        {t(orderAddressFallbackKey(order.deliveryType))}
                      </Typography>
                    </Box>
                  )}
                  <Box layoutClassName="mt-1.5">
                    <Box layoutClassName="mb-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <Package className="h-3 w-3 shrink-0" />
                      <span className="font-medium">{getItemCount(order)} món</span>
                    </Box>
                    {(order.items?.length ?? 0) >= 2 ? <OrderItemsMini items={order.items ?? []} /> : null}
                  </Box>
                </Box>
              </Box>

              {/* Total + badges */}
              <Box
                layoutClassName="flex items-center justify-between gap-2 border-t px-4 py-2.5"
                borderClassName="border-slate-100 dark:border-slate-700"
                backgroundClassName="bg-white/60 dark:bg-slate-900/30"
              >
                <Box layoutClassName="flex items-center gap-1.5">
                  <Badge
                    size="sm"
                    layoutClassName="px-2 py-0.5 text-[10px] font-semibold"
                    borderClassName="border-transparent"
                    className={STATUS_COLORS[order.status]}
                  >
                    {t(`orders.statusLabels.${order.status}`)}
                  </Badge>
                  <Badge
                    size="sm"
                    layoutClassName="px-2 py-0.5 text-[10px] font-bold uppercase"
                    borderClassName="border-transparent"
                    className={PAYMENT_STATUS_COLORS[order.paymentStatus]}
                  >
                    {t(`orders.paymentStatusLabels.${order.paymentStatus}`)}
                  </Badge>
                  {isFreeShip(order) && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800">
                      FREE SHIP
                    </span>
                  )}
                  {order.discountAmount && order.discountAmount > 0 ? (
                    <Badge
                      size="sm"
                      layoutClassName="px-2 py-0.5 text-[10px] font-bold"
                      borderClassName="border-transparent"
                      backgroundClassName="bg-emerald-100 dark:bg-emerald-900/40"
                      textClassName="text-emerald-700 dark:text-emerald-300"
                    >
                      KM −{formatVND(order.discountAmount)}
                    </Badge>
                  ) : null}
                  {order.surchargeAmount && order.surchargeAmount > 0 ? (
                    <Badge
                      size="sm"
                      layoutClassName="px-2 py-0.5 text-[10px] font-semibold"
                      borderClassName="border-primary-200 dark:border-primary-800"
                      backgroundClassName="bg-primary-50 dark:bg-primary-900/30"
                      textClassName="text-primary-700 dark:text-primary-300"
                    >
                      {surchargeTagLabel(order.surchargeTag, surchargeTags)} {formatVND(order.surchargeAmount)}
                    </Badge>
                  ) : null}
                </Box>
                <Typography
                  as="div"
                  size="sm"
                  layoutClassName="font-bold"
                  textClassName="text-primary-600 dark:text-primary-400"
                >
                  {formatVND(order.total)}
                </Typography>
              </Box>

              <Box layoutClassName="flex items-center justify-end gap-1 px-4 pb-2 pt-1">
                <Typography
                  as="span"
                  size="xs"
                  variant="muted"
                  layoutClassName="font-mono"
                >
                  {order.orderNumber || order.id}
                </Typography>
              </Box>
            </Card>
          );
        })
      ) : (
        <Card
          padding="md"
          layoutClassName="border-dashed py-10 text-center text-sm"
          borderClassName="border-slate-100 dark:border-slate-700"
          textClassName="text-slate-400 dark:text-slate-500"
        >
          {t('orders.noOrdersCriteria')}
        </Card>
      )}
      </Box>
    </Box>
  );
};

export default OrderListMobile;

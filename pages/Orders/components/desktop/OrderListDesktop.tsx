import React from 'react';
import {
  CalendarDays,
  MapPin,
  Package,
  Phone,
  User,
} from 'lucide-react';
import { PAYMENT_METHOD_COLORS, PAYMENT_STATUS_COLORS, STATUS_COLORS } from '@/constant/order';
import { useLanguage } from '@/contexts/LanguageContext';
import { Order } from '@/types';
import { DeliveryType } from '@/types/enums';

/** FREE SHIP = ship cost 0 và là đơn giao (SHIP/SHIP_PROVINCE, hoặc đơn cũ có địa chỉ) */
const isFreeShip = (order: Order) => {
  if (order.shippingCost && order.shippingCost > 0) return false;
  if (order.deliveryType === DeliveryType.PICKUP) return false;
  if (order.deliveryType === DeliveryType.SHIP || order.deliveryType === DeliveryType.SHIP_PROVINCE) return true;
  // Đơn cũ không có deliveryType → dùng address làm dấu hiệu giao hàng
  return !!order.customer?.address;
};
import { formatVND } from '@/utils/format/currencyUtil';
import { buildDeliveryBadge } from '@/utils/order/deliveryDateBadge';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';

interface OrderListDesktopProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  renderProductSummary: (order: Order) => React.ReactNode;
}

const OrderListDesktop: React.FC<OrderListDesktopProps> = ({
  orders,
  onSelectOrder,
}) => {
  const { t } = useLanguage();

  const getItemsPreview = (order: Order) => {
    if (!order.items || order.items.length === 0) return '';
    const names = order.items.map((it) => it.name).filter(Boolean);
    if (names.length <= 3) return names.join(', ');
    return `${names.slice(0, 3).join(', ')} +${names.length - 3} món khác`;
  };

  const getOrderImage = (order: Order) =>
    order.items?.[0]?.image ||
    `https://placehold.co/200x200?text=${encodeURIComponent(order.items?.[0]?.name || 'Order')}`;

  return (
    <Box layoutClassName="hidden flex-1 overflow-auto lg:block">
      <Box layoutClassName="space-y-3 px-3 pb-3">
        {orders.length > 0 ? (
          orders.map((order) => {
            const dlv = buildDeliveryBadge(order.deliveryDate, { status: order.status });
            const totalItems =
              order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
            return (
              <Card
                key={order.id}
                padding="none"
                layoutClassName={`cursor-pointer overflow-hidden border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${dlv.cardClass} ${order.isTest ? 'ring-2 ring-amber-400 ring-offset-1 dark:ring-amber-500 dark:ring-offset-slate-900' : ''}`}
                borderClassName=""
                backgroundClassName=""
                onClick={() => onSelectOrder(order)}
              >
                {/* TEST RIBBON — chỉ hiện với đơn test */}
                {order.isTest ? (
                  <Box
                    layoutClassName="flex items-center justify-center gap-1.5 border-b border-amber-200 bg-amber-100 px-4 py-1 text-amber-900 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-100"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-widest">🧪 Đơn hàng test</span>
                  </Box>
                ) : null}
                {/* HERO STRIP: delivery date countdown — màu theo độ khẩn */}
                <Box
                  layoutClassName={`flex items-center justify-between gap-3 border-b px-4 py-2.5 ${dlv.stripClass}`}
                >
                  <Box layoutClassName="flex min-w-0 items-center gap-2">
                    <CalendarDays className="h-4 w-4 shrink-0" />
                    <Typography
                      as="span"
                      size="sm"
                      layoutClassName="text-[15px] font-bold"
                    >
                      {dlv.label}
                    </Typography>
                    <Typography
                      as="span"
                      size="xs"
                      layoutClassName="opacity-80"
                    >
                      · {dlv.sublabel}
                      {order.deliveryTime ? ` · ${order.deliveryTime}` : ''}
                    </Typography>
                  </Box>
                  <Typography
                    as="span"
                    size="xs"
                    layoutClassName="font-mono opacity-70"
                  >
                    {order.orderNumber || order.id}
                  </Typography>
                </Box>

                {/* Body grid: image | customer & items | total */}
                <Box layoutClassName="grid grid-cols-[120px_1fr_200px] items-stretch">
                  <Box
                    layoutClassName="flex h-[120px] w-[120px] shrink-0 items-center justify-center p-3"
                    backgroundClassName="bg-slate-50/50 dark:bg-slate-900/20"
                  >
                    <Box
                      layoutClassName="h-full w-full overflow-hidden"
                      roundedClassName="rounded-xl"
                      borderClassName="border border-slate-200 dark:border-slate-700"
                      shadowClassName="shadow-sm"
                    >
                      <img
                        src={getOrderImage(order)}
                        alt={order.items?.[0]?.name || 'Order'}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </Box>
                  </Box>

                  <Box layoutClassName="min-w-0 p-4">
                    <Box layoutClassName="flex items-center gap-1.5">
                      <User className="h-4 w-4 shrink-0 text-slate-400" />
                      <Typography
                        as="span"
                        size="base"
                        layoutClassName="truncate text-[16px] font-bold"
                        textClassName="text-slate-900 dark:text-slate-50"
                      >
                        {order.customer?.name || '—'}
                      </Typography>
                    </Box>
                    {order.customer?.phone ? (
                      <Box layoutClassName="mt-1 flex items-center gap-1.5">
                        <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                        <a
                          href={`tel:${order.customer.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="truncate text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {order.customer.phone}
                        </a>
                      </Box>
                    ) : null}
                    {order.customer?.address ? (
                      <Box layoutClassName="mt-1 flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                        <span className="line-clamp-1">{order.customer.address}</span>
                      </Box>
                    ) : null}

                    <Box layoutClassName="mt-2 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <Package className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="line-clamp-1">
                        {totalItems} món · {getItemsPreview(order) || '—'}
                      </span>
                    </Box>

                    <Box layoutClassName="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge
                        size="sm"
                        layoutClassName="px-2 py-0.5 text-[11px] font-semibold"
                        borderClassName="border-transparent"
                        className={STATUS_COLORS[order.status]}
                      >
                        {t(`orders.statusLabels.${order.status}`)}
                      </Badge>
                      <Badge
                        size="sm"
                        layoutClassName="px-2 py-0.5 text-[11px] font-bold uppercase"
                        borderClassName="border-transparent"
                        className={PAYMENT_STATUS_COLORS[order.paymentStatus]}
                      >
                        {t(`orders.paymentStatusLabels.${order.paymentStatus}`)}
                      </Badge>
                      <Badge
                        size="sm"
                        layoutClassName="px-2 py-0.5 text-[11px] font-semibold"
                        borderClassName="border-transparent"
                        className={PAYMENT_METHOD_COLORS[order.paymentMethod]}
                      >
                        {order.paymentMethod === 'BANKING'
                          ? t('paymentMethod.banking')
                          : t('paymentMethod.cash')}
                      </Badge>
                      {isFreeShip(order) && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-800">
                          FREE SHIP
                        </span>
                      )}
                      {order.discountAmount && order.discountAmount > 0 ? (
                        <Badge
                          size="sm"
                          layoutClassName="px-2 py-0.5 text-[11px] font-bold"
                          borderClassName="border-transparent"
                          backgroundClassName="bg-emerald-100 dark:bg-emerald-900/40"
                          textClassName="text-emerald-700 dark:text-emerald-300"
                        >
                          KM −{formatVND(order.discountAmount)}
                        </Badge>
                      ) : null}
                      {order.createdBy ? (
                        <Typography
                          as="span"
                          size="xs"
                          variant="muted"
                          layoutClassName="ml-1"
                        >
                          · {order.createdBy}
                        </Typography>
                      ) : null}
                    </Box>
                  </Box>

                  <Box
                    layoutClassName="flex flex-col items-end justify-center border-l px-4 py-3 text-right"
                    borderClassName="border-l border-slate-100 dark:border-slate-700"
                    backgroundClassName="bg-white/60 dark:bg-slate-900/30"
                  >
                    <Typography as="span" size="xs" variant="muted">
                      Tổng tiền
                    </Typography>
                    <Typography
                      as="p"
                      size="xl"
                      layoutClassName="mt-1 text-2xl font-extrabold leading-none"
                      textClassName="text-primary-600 dark:text-primary-400"
                    >
                      {formatVND(order.total)}
                    </Typography>
                    {order.shippingCost ? (
                      <Typography as="span" size="xs" variant="muted" layoutClassName="mt-1">
                        Ship: {formatVND(order.shippingCost)}
                      </Typography>
                    ) : null}
                  </Box>
                </Box>
              </Card>
            );
          })
        ) : (
          <Card
            padding="md"
            layoutClassName="border-dashed py-10 text-center text-sm"
            borderClassName="border-slate-200 dark:border-slate-700"
            textClassName="text-slate-400 dark:text-slate-500"
          >
            {t('orders.noOrdersCriteria')}
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default OrderListDesktop;

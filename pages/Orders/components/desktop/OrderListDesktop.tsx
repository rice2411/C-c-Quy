import React from 'react';
import {
  CalendarDays,
  Globe,
  MapPin,
  Package,
  Phone,
  Printer,
  Store,
  User,
} from 'lucide-react';
import { PAYMENT_METHOD_COLORS, PAYMENT_STATUS_COLORS, STATUS_COLORS } from '@/constant/order';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSurchargeTags } from '@/hooks/queries/useSurchargeTagsQuery';
import { useProducts } from '@/hooks/queries/useProductsQuery';
import { orderAddressFallbackKey, surchargeTagLabel } from '@/types/order';
import { Order } from '@/types';
import { DeliveryType } from '@/types/enums';
import { orderItemsTotalQty } from '@/pages/Orders/orderItemRows';

/** FREE SHIP = ship cost 0 và là đơn giao (SHIP/SHIP_PROVINCE, hoặc đơn cũ có địa chỉ) */
const isFreeShip = (order: Order) => {
  if (order.shippingCost && order.shippingCost > 0) return false;
  if (order.deliveryType === DeliveryType.PICKUP) return false;
  if (order.deliveryType === DeliveryType.SHIP || order.deliveryType === DeliveryType.SHIP_PROVINCE) return true;
  // Đơn cũ không có deliveryType → dùng address làm dấu hiệu giao hàng
  return !!order.customer?.address;
};
import { formatVND } from '@/utils/format/currencyUtil';
import { getDepositInfo } from '@/utils/order/orderUtils';
import { buildDeliveryBadge } from '@/utils/order/deliveryDateBadge';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import OrderItemsMini from '@/pages/Orders/components/OrderItemsMini';
import CarrierBadge from '@/pages/Orders/components/CarrierBadge';

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
  const { surchargeTags } = useSurchargeTags();
  const { products } = useProducts();

  const getOrderImage = (order: Order) => {
    const first = order.items?.[0];
    return (
      first?.image ||
      products.find((p) => p.id === first?.productId)?.image ||
      `https://placehold.co/200x200?text=${encodeURIComponent(first?.name || 'Order')}`
    );
  };

  return (
    <Box layoutClassName="hidden flex-1 overflow-auto lg:block">
      <Box layoutClassName="space-y-3 px-3 pb-3">
        {orders.length > 0 ? (
          orders.map((order) => {
            const dlv = buildDeliveryBadge(order.deliveryDate, { status: order.status });
            const totalItems = orderItemsTotalQty(order.items);
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
                  <Box layoutClassName="flex items-center gap-1.5">
                    <Box
                      layoutClassName="inline-flex items-center gap-1 px-1.5 py-0.5"
                      roundedClassName="rounded-full"
                      backgroundClassName={order.billPrintedAt ? 'bg-slate-100 dark:bg-slate-700/50' : 'bg-amber-100 dark:bg-amber-900/40'}
                    >
                      <Printer className={`h-3 w-3 shrink-0 ${order.billPrintedAt ? 'text-slate-400 dark:text-slate-500' : 'text-amber-600 dark:text-amber-400'}`} />
                      <Typography
                        as="span"
                        size="xs"
                        layoutClassName="font-semibold leading-none"
                        textClassName={order.billPrintedAt ? 'text-slate-400 dark:text-slate-500' : 'text-amber-700 dark:text-amber-300'}
                      >
                        {order.billPrintedAt ? 'Đã in' : 'Chưa in'}
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
                        layoutClassName="min-w-0 truncate text-[16px] font-bold"
                        textClassName="text-slate-900 dark:text-slate-50"
                      >
                        {order.customer?.name || '—'}
                      </Typography>
                      <CarrierBadge order={order} />
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
                        <Typography as="span" layoutClassName="line-clamp-1">
                          {order.customer.address}
                        </Typography>
                      </Box>
                    ) : (
                      <Box layoutClassName="mt-1 flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
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

                    <Box layoutClassName="mt-2">
                      <Box layoutClassName="mb-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Package className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="font-medium">{totalItems} món</span>
                        {order.items?.find((i) => i.packagingOption)?.packagingOption ? (
                          <Badge
                            size="sm"
                            layoutClassName="px-2 py-0.5 text-[11px] font-semibold"
                            borderClassName="border-transparent"
                            backgroundClassName="bg-primary-100 dark:bg-primary-900/40"
                            textClassName="text-primary-700 dark:text-primary-300"
                          >
                            📦 {order.items.find((i) => i.packagingOption)?.packagingOption}
                          </Badge>
                        ) : null}
                      </Box>
                      {order.deliveryType === DeliveryType.SHIP_PROVINCE || order.trackingNumber ? (
                        <Box layoutClassName="mb-1 flex flex-wrap items-center gap-1.5 text-xs">
                          {order.deliveryType === DeliveryType.SHIP_PROVINCE ? (
                            <Badge
                              size="sm"
                              layoutClassName="px-2 py-0.5 text-[11px] font-semibold"
                              borderClassName="border-transparent"
                              backgroundClassName="bg-sky-100 dark:bg-sky-900/40"
                              textClassName="text-sky-700 dark:text-sky-300"
                            >
                              🚚 Ship tỉnh
                            </Badge>
                          ) : null}
                          {order.trackingNumber ? (
                            order.trackingLink ? (
                              <a
                                href={order.trackingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="font-medium text-blue-600 underline hover:opacity-80 dark:text-blue-400"
                              >
                                {order.trackingNumber}
                              </a>
                            ) : (
                              <Typography as="span" size="xs" layoutClassName="font-medium" textClassName="text-slate-600 dark:text-slate-300">
                                {order.trackingNumber}
                              </Typography>
                            )
                          ) : (
                            <Typography as="span" size="xs" textClassName="text-slate-400 dark:text-slate-500">chưa có mã VĐ</Typography>
                          )}
                          {order.trackingStatus ? (
                            <Typography as="span" size="xs" variant="muted">· {order.trackingStatus}</Typography>
                          ) : null}
                        </Box>
                      ) : null}
                      <OrderItemsMini items={order.items ?? []} />
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
                      {order.surchargeAmount && order.surchargeAmount > 0 ? (
                        <Badge
                          size="sm"
                          layoutClassName="px-2 py-0.5 text-[11px] font-semibold"
                          borderClassName="border-primary-200 dark:border-primary-800"
                          backgroundClassName="bg-primary-50 dark:bg-primary-900/30"
                          textClassName="text-primary-700 dark:text-primary-300"
                        >
                          {surchargeTagLabel(order.surchargeTag, surchargeTags)} {formatVND(order.surchargeAmount)}
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
                    {(() => {
                      const dep = getDepositInfo(order, Number(order.total));
                      return dep.show ? (
                        <Typography as="span" size="xs" layoutClassName="mt-1 font-medium" textClassName="text-amber-600 dark:text-amber-400">
                          Cọc {formatVND(dep.deposit || dep.paid)} · {dep.statusLabel}{dep.remaining > 0 && dep.paid < Number(order.total) ? ` · Còn ${formatVND(dep.remaining)}` : ''}
                        </Typography>
                      ) : null;
                    })()}
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

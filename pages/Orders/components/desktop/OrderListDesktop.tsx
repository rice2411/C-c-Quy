import React from 'react';
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  CalendarDays,
  MapPin,
  Package,
  Phone,
  User,
} from 'lucide-react';
import { PAYMENT_METHOD_COLORS, PAYMENT_STATUS_COLORS, STATUS_COLORS } from '@/constant/order';
import { useLanguage } from '@/contexts/LanguageContext';
import { Order } from '@/types';
import { formatVND } from '@/utils/currencyUtil';
import { buildDeliveryBadge } from '@/utils/deliveryDateBadge';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';

interface OrderListDesktopProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  renderProductSummary: (order: Order) => React.ReactNode;
  sortField: keyof Order;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof Order) => void;
}

const OrderListDesktop: React.FC<OrderListDesktopProps> = ({
  orders,
  onSelectOrder,
  sortField,
  sortDirection,
  onSort,
}) => {
  const { t } = useLanguage();

  const sortButtonClass = (field: keyof Order) =>
    sortField === field
      ? 'border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-500/50 dark:bg-orange-900/20 dark:text-orange-300'
      : 'border-slate-200 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300';

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
      {/* Sort toolbar */}
      <Box
        layoutClassName="sticky top-0 z-10 mb-3 flex items-center gap-2 border-b p-3"
        borderClassName="border-slate-200 dark:border-slate-700"
        backgroundClassName="bg-slate-50/95 dark:bg-slate-900/95"
      >
        <Typography
          size="xs"
          variant="muted"
          layoutClassName="mr-1 font-semibold uppercase tracking-wide"
        >
          Sắp xếp:
        </Typography>
        <Button
          type="button"
          onClick={() => onSort('deliveryDate' as keyof Order)}
          variant="secondary"
          disableVariantHover
          disableVariantTextColor
          borderClassName={`border ${sortButtonClass('deliveryDate' as keyof Order)}`}
          roundedClassName="rounded-lg"
          sizeClassName="px-3 py-1.5"
          textClassName="text-xs font-semibold"
          leftIcon={
            sortField === ('deliveryDate' as keyof Order) && sortDirection === 'asc' ? (
              <ArrowUpWideNarrow />
            ) : (
              <ArrowDownWideNarrow />
            )
          }
          iconClassName="inline-flex [&_svg]:h-3.5 [&_svg]:w-3.5"
        >
          Ngày giao (gấp nhất)
        </Button>
        <Button
          type="button"
          onClick={() => onSort('date')}
          variant="secondary"
          disableVariantHover
          disableVariantTextColor
          borderClassName={`border ${sortButtonClass('date')}`}
          roundedClassName="rounded-lg"
          sizeClassName="px-3 py-1.5"
          textClassName="text-xs font-semibold"
          leftIcon={
            sortField === 'date' && sortDirection === 'asc' ? (
              <ArrowUpWideNarrow />
            ) : (
              <ArrowDownWideNarrow />
            )
          }
          iconClassName="inline-flex [&_svg]:h-3.5 [&_svg]:w-3.5"
        >
          {t('orders.tableDate')}
        </Button>
        <Button
          type="button"
          onClick={() => onSort('total')}
          variant="secondary"
          disableVariantHover
          disableVariantTextColor
          borderClassName={`border ${sortButtonClass('total')}`}
          roundedClassName="rounded-lg"
          sizeClassName="px-3 py-1.5"
          textClassName="text-xs font-semibold"
          leftIcon={
            sortField === 'total' && sortDirection === 'asc' ? (
              <ArrowUpWideNarrow />
            ) : (
              <ArrowDownWideNarrow />
            )
          }
          iconClassName="inline-flex [&_svg]:h-3.5 [&_svg]:w-3.5"
        >
          {t('orders.tableTotal')}
        </Button>
        <Button
          type="button"
          onClick={() => onSort('status')}
          variant="secondary"
          disableVariantHover
          disableVariantTextColor
          borderClassName={`border ${sortButtonClass('status')}`}
          roundedClassName="rounded-lg"
          sizeClassName="px-3 py-1.5"
          textClassName="text-xs font-semibold"
          leftIcon={
            sortField === 'status' && sortDirection === 'asc' ? (
              <ArrowUpWideNarrow />
            ) : (
              <ArrowDownWideNarrow />
            )
          }
          iconClassName="inline-flex [&_svg]:h-3.5 [&_svg]:w-3.5"
        >
          {t('orders.tableStatus')}
        </Button>
      </Box>

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
                layoutClassName={`cursor-pointer overflow-hidden border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${dlv.cardClass}`}
                borderClassName=""
                backgroundClassName=""
                onClick={() => onSelectOrder(order)}
              >
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
                    layoutClassName="flex h-[120px] w-[120px] shrink-0 items-center justify-center overflow-hidden"
                    borderClassName="border-r border-slate-100 dark:border-slate-700"
                    backgroundClassName="bg-white/40 dark:bg-slate-900/20"
                  >
                    <img
                      src={getOrderImage(order)}
                      alt={order.items?.[0]?.name || 'Order'}
                      className="h-full w-full object-cover"
                    />
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
                      textClassName="text-orange-600 dark:text-orange-400"
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

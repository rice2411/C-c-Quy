import React from 'react';
import { ArrowDownWideNarrow, ArrowUpWideNarrow, CalendarDays, ChevronRight, MapPin, Package, Phone, User } from 'lucide-react';
import { PAYMENT_STATUS_COLORS, STATUS_COLORS } from '@/constant/order';
import { useLanguage } from '@/contexts/LanguageContext';
import { Order } from '@/types';
import { formatVND } from '@/utils/currencyUtil';
import { buildDeliveryBadge } from '@/utils/deliveryDateBadge';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';

interface OrderListMobileProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  renderProductSummary: (order: Order) => React.ReactNode;
  sortField: keyof Order;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof Order) => void;
}

const OrderListMobile: React.FC<OrderListMobileProps> = ({ orders, onSelectOrder, sortField, sortDirection, onSort }) => {
  const { t } = useLanguage();

  const getItemCount = (order: Order) =>
    order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

  const getItemsPreview = (order: Order) => {
    if (!order.items || order.items.length === 0) return '';
    const names = order.items.map((it) => it.name).filter(Boolean);
    if (names.length <= 2) return names.join(', ');
    return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  };

  const getOrderImage = (order: Order) =>
    order.items?.[0]?.image ||
    `https://placehold.co/200x200?text=${encodeURIComponent(order.items?.[0]?.name || 'Order')}`;

  const SortChip: React.FC<{ field: keyof Order; label: string }> = ({ field, label }) => {
    const active = sortField === field;
    const arrow = active ? (sortDirection === 'asc' ? <ArrowUpWideNarrow className="h-3 w-3" /> : <ArrowDownWideNarrow className="h-3 w-3" />) : null;
    return (
      <button
        type="button"
        onClick={() => onSort(field)}
        className={
          'flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ' +
          (active
            ? 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-600 dark:bg-orange-900/30 dark:text-orange-200'
            : 'border-slate-200 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300')
        }
      >
        {label}
        {arrow}
      </button>
    );
  };

  return (
    <Box
      layoutClassName="flex-1 overflow-y-auto lg:hidden"
      backgroundClassName="bg-slate-50/50 dark:bg-slate-900/50"
    >
      {/* Sort chip bar - sticky */}
      <Box
        layoutClassName="sticky top-0 z-10 flex gap-1.5 overflow-x-auto border-b px-3 py-2"
        borderClassName="border-slate-200 dark:border-slate-700"
        backgroundClassName="bg-white/95 backdrop-blur dark:bg-slate-900/95"
      >
        <SortChip field={'deliveryDate' as keyof Order} label="Ngày giao" />
        <SortChip field="date" label="Ngày tạo" />
        <SortChip field="total" label="Tổng tiền" />
        <SortChip field="status" label="Trạng thái" />
      </Box>

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
                  roundedClassName="rounded-md"
                  borderClassName="border border-slate-200 dark:border-slate-600"
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
                      <span className="line-clamp-1">{order.customer.address}</span>
                    </Box>
                  ) : null}
                  <Box layoutClassName="mt-1.5 flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                    <Package className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      {getItemCount(order)} món · {getItemsPreview(order) || '—'}
                    </span>
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
                </Box>
                <Typography
                  as="div"
                  size="sm"
                  layoutClassName="font-bold"
                  textClassName="text-orange-600 dark:text-orange-400"
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

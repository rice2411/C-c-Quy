import React from 'react';
import { ArrowDownWideNarrow, ArrowUpWideNarrow, CalendarDays, Package } from 'lucide-react';
import { PAYMENT_METHOD_COLORS, PAYMENT_STATUS_COLORS, STATUS_COLORS } from '@/constant/order';
import { useLanguage } from '@/contexts/LanguageContext';
import { Order } from '@/types';
import { formatVND } from '@/utils/currencyUtil';
import { formatDateOnly, formatDateTime } from '@/utils/dateUtil';
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
  renderProductSummary,
  sortField,
  sortDirection,
  onSort
}) => {
  const { t } = useLanguage();

  const sortButtonClass = (field: keyof Order) =>
    sortField === field
      ? 'border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-500/50 dark:bg-orange-900/20 dark:text-orange-300'
      : 'border-slate-200 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300';

  const getOrderImage = (order: Order) =>
    order.items?.[0]?.image || `https://placehold.co/160x160?text=${encodeURIComponent(order.items?.[0]?.name || 'Order')}`;

  return (
    <Box layoutClassName="hidden flex-1 overflow-auto lg:block">
      <Box
        layoutClassName="sticky top-0 z-10 mb-3 flex items-center gap-2 border-b p-3"
        borderClassName="border-slate-200 dark:border-slate-700"
        backgroundClassName="bg-slate-50/95 dark:bg-slate-900/95"
      >
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
          leftIcon={sortField === 'date' && sortDirection === 'asc' ? <ArrowUpWideNarrow /> : <ArrowDownWideNarrow />}
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
          leftIcon={sortField === 'total' && sortDirection === 'asc' ? <ArrowUpWideNarrow /> : <ArrowDownWideNarrow />}
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
          leftIcon={sortField === 'status' && sortDirection === 'asc' ? <ArrowUpWideNarrow /> : <ArrowDownWideNarrow />}
          iconClassName="inline-flex [&_svg]:h-3.5 [&_svg]:w-3.5"
        >
          {t('orders.tableStatus')}
        </Button>
      </Box>

      <Box layoutClassName="space-y-3 px-3 pb-3">
        {orders.length > 0 ? (
          orders.map((order) => {
            const totalItems = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
            const firstItem = order.items?.[0];
            const displayedItems = (order.items || []).slice(0, 3);
            return (
              <Card
                key={order.id}
                padding="none"
                layoutClassName="cursor-pointer overflow-hidden border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                borderClassName="border-slate-200 dark:border-slate-700"
                backgroundClassName="bg-white dark:bg-slate-800"
                onClick={() => onSelectOrder(order)}
              >
                <Box
                  layoutClassName="flex items-center justify-between border-b px-4 py-3"
                  borderClassName="border-slate-100 dark:border-slate-700"
                  backgroundClassName="bg-slate-50/80 dark:bg-slate-800/80"
                >
                  <Box layoutClassName="flex items-center gap-2">
                    <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-slate-900 dark:text-slate-100">
                      {order.orderNumber || order.id}
                    </Typography>
                    <Badge
                      size="sm"
                      layoutClassName="px-2 py-0.5 text-[11px] font-semibold"
                      borderClassName="border-transparent"
                      className={STATUS_COLORS[order.status]}
                    >
                      {t(`orders.statusLabels.${order.status}`)}
                    </Badge>
                  </Box>
                  <Box layoutClassName="flex items-center gap-2">
                    <Badge
                      size="sm"
                      layoutClassName="px-2 py-0.5 text-[11px] font-semibold"
                      borderClassName="border-transparent"
                      className={PAYMENT_METHOD_COLORS[order.paymentMethod]}
                    >
                      {order.paymentMethod === 'BANKING' ? t('paymentMethod.banking') : t('paymentMethod.cash')}
                    </Badge>
                    <Badge
                      size="sm"
                      layoutClassName="px-2 py-0.5 text-[11px] font-bold uppercase"
                      borderClassName="border-transparent"
                      className={PAYMENT_STATUS_COLORS[order.paymentStatus]}
                    >
                      {t(`orders.paymentStatusLabels.${order.paymentStatus}`)}
                    </Badge>
                  </Box>
                </Box>

                <Box layoutClassName="grid grid-cols-[132px_1fr_220px] gap-0">
                  <Box
                    layoutClassName="flex h-[132px] w-[132px] shrink-0 items-center justify-center overflow-hidden"
                    borderClassName="border-r border-slate-100 dark:border-slate-700"
                    backgroundClassName="bg-slate-50 dark:bg-slate-800"
                  >
                    <img
                      src={getOrderImage(order)}
                      alt={firstItem?.name || 'Order item'}
                      className="h-[112px] w-[112px] rounded-md object-cover"
                    />
                  </Box>

                  <Box layoutClassName="min-w-0 px-4 py-3">
                    <Typography size="sm" layoutClassName="line-clamp-1 font-semibold" textClassName="text-slate-900 dark:text-slate-100">
                      {firstItem?.name || t('orders.tableProduct')}
                    </Typography>
                    <Typography size="xs" variant="muted" layoutClassName="mt-1 line-clamp-1">
                      {renderProductSummary(order)}
                    </Typography>
                    <Box layoutClassName="mt-2 rounded-md border border-slate-100 p-2 dark:border-slate-700">
                      <Box layoutClassName="space-y-1">
                        {displayedItems.map((item) => (
                          <Box
                            key={`${order.id}-${item.id}`}
                            layoutClassName="flex items-center justify-between gap-2 rounded px-1.5 py-1"
                          >
                            <Box layoutClassName="min-w-0">
                              <Typography size="xs" layoutClassName="truncate" textClassName="text-slate-700 dark:text-slate-200">
                                {item.name}
                              </Typography>
                              <Typography as="span" size="xs" variant="muted">
                                SL: {item.quantity}
                              </Typography>
                            </Box>
                            <Typography as="span" size="xs" variant="muted" layoutClassName="shrink-0">
                              {formatVND(Number(item.price) * Number(item.quantity))}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                      {order.items && order.items.length > displayedItems.length ? (
                        <Typography size="xs" variant="muted" layoutClassName="mt-1 block">
                          +{order.items.length - displayedItems.length} sản phẩm khác
                        </Typography>
                      ) : null}
                    </Box>
                    <Box layoutClassName="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <Typography as="span" variant="muted" layoutClassName="block">
                        Người tạo: {order.createdBy || '--'}
                      </Typography>
                      <Typography as="span" variant="muted" layoutClassName="block text-right">
                        Phí ship: {formatVND(order.shippingCost || 0)}
                      </Typography>
                    </Box>
                    <Box layoutClassName="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <Box layoutClassName="flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5" />
                        <span>{totalItems} sản phẩm</span>
                      </Box>
                      <Box layoutClassName="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>Tạo: {formatDateTime(order.createdAt || order.orderDate || order.date)}</span>
                      </Box>
                    </Box>
                  </Box>

                  <Box
                    layoutClassName="flex flex-col justify-center px-4 py-3 text-right"
                    borderClassName="border-l border-slate-100 dark:border-slate-700"
                    backgroundClassName="bg-slate-50/70 dark:bg-slate-800/50"
                  >
                    <Typography as="span" size="xs" variant="muted">
                      {t('orders.tableTotal')}
                    </Typography>
                    <Typography as="p" size="lg" layoutClassName="mt-1 font-bold" textClassName="text-orange-600 dark:text-orange-400">
                      {formatVND(order.total)}
                    </Typography>
                    <Box
                      layoutClassName="mt-2 rounded-lg p-3 text-left"
                      backgroundClassName="bg-white/90 dark:bg-slate-700/50"
                      borderClassName="border border-slate-200 dark:border-slate-600"
                    >
                      <Box layoutClassName="space-y-1">
                        <Typography as="span" size="xs" variant="muted" layoutClassName="block">
                          Khách hàng
                        </Typography>
                        <Typography as="span" size="sm" layoutClassName="block font-medium" textClassName="text-slate-900 dark:text-slate-100">
                          {order.customer.name}
                        </Typography>
                        <Typography as="span" size="xs" variant="muted" layoutClassName="block">
                          {order.customer.phone || order.customer.email || '--'}
                        </Typography>
                        <Typography as="span" size="xs" variant="muted" layoutClassName="block">
                          Ngày giao: {order.deliveryDate ? `${formatDateOnly(order.deliveryDate)}${order.deliveryTime ? ` • ${order.deliveryTime}` : ''}` : '--'}
                        </Typography>
                        <Typography as="span" size="xs" variant="muted" layoutClassName="line-clamp-2 block">
                          {order.customer.address || '--'}
                        </Typography>
                      </Box>
                    </Box>
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

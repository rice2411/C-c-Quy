import React from 'react';
import { Calendar, ChevronRight, Package, User } from 'lucide-react';
import { PAYMENT_METHOD_COLORS, PAYMENT_STATUS_COLORS, STATUS_COLORS } from '@/constant/order';
import { useLanguage } from '@/contexts/LanguageContext';
import { Order } from '@/types';
import { formatVND } from '@/utils/currencyUtil';
import { formatDateOnly, formatDateTime } from '@/utils/dateUtil';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';

interface OrderListMobileProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  renderProductSummary: (order: Order) => React.ReactNode;
}

const OrderListMobile: React.FC<OrderListMobileProps> = ({ orders, onSelectOrder, renderProductSummary }) => {
  const { t } = useLanguage();
  const getItemCount = (order: Order) => order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

  return (
    <Box
      layoutClassName="flex-1 space-y-4 overflow-y-auto p-4 lg:hidden"
      backgroundClassName="bg-slate-50/50 dark:bg-slate-900/50"
    >
      {orders.length > 0 ? (
        orders.map((order) => (
          <Card
            key={order.id}
            padding="md"
            layoutClassName="relative cursor-pointer transition-all active:scale-[0.98] group"
            onClick={() => onSelectOrder(order)}
            borderClassName="border-slate-200 dark:border-slate-700"
          >
            <Box
              layoutClassName="mb-3 flex items-center justify-between border-b pb-2"
              borderClassName="border-slate-100 dark:border-slate-700"
            >
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

            <Box layoutClassName="mb-3 grid grid-cols-[80px_1fr] gap-3">
              <Box
                layoutClassName="h-20 w-20 shrink-0 overflow-hidden"
                roundedClassName="rounded-md"
                borderClassName="border border-slate-200 dark:border-slate-600"
              >
                <img
                  src={order.items?.[0]?.image || `https://placehold.co/120x120?text=${encodeURIComponent(order.items?.[0]?.name || 'Order')}`}
                  alt={order.items?.[0]?.name || 'Order item'}
                  className="h-full w-full object-cover"
                />
              </Box>
              <Box layoutClassName="min-w-0 flex-1">
                <Typography size="sm" layoutClassName="line-clamp-2 font-medium" textClassName="text-slate-900 dark:text-white">
                  {order.items?.[0]?.name || t('orders.tableProduct')}
                </Typography>
                <Typography size="sm" variant="muted" layoutClassName="mt-1 line-clamp-1">
                  {renderProductSummary(order)}
                </Typography>
                <Box layoutClassName="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <Box layoutClassName="flex items-center gap-1">
                    <Package className="h-3.5 w-3.5" />
                    <span>{getItemCount(order)} sản phẩm</span>
                  </Box>
                  <Box layoutClassName="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Tạo: {formatDateOnly(order.orderDate || order.date)}</span>
                  </Box>
                </Box>
                <Box
                  layoutClassName="mt-2 rounded-md border border-slate-100 p-2 text-xs dark:border-slate-700"
                  backgroundClassName="bg-slate-50/70 dark:bg-slate-800/50"
                >
                  <Box layoutClassName="flex items-center justify-between gap-2">
                    <Typography size="xs" variant="muted">Người tạo: {order.createdBy || '--'}</Typography>
                    <Typography size="xs" variant="muted">Phí ship: {formatVND(order.shippingCost || 0)}</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box layoutClassName="mb-3 text-right border-t pt-2" borderClassName="border-slate-100 dark:border-slate-700">
              <Typography size="sm" variant="muted">
                Tổng số tiền ({getItemCount(order)} sản phẩm):{' '}
                <span className="font-bold text-slate-900 dark:text-white">{formatVND(order.total)}</span>
              </Typography>
            </Box>

            {order.deliveryDate ? (
              <Box
                layoutClassName="mb-3 flex items-center justify-between rounded-lg p-3"
                backgroundClassName="bg-teal-50 dark:bg-teal-900/20"
              >
                <Box>
                  <Typography size="sm" layoutClassName="font-semibold" textClassName="text-teal-700 dark:text-teal-300">
                    Ngày giao dự kiến: {formatDateOnly(order.deliveryDate)}
                  </Typography>
                  <Typography size="sm" variant="secondary">
                    {t(`orders.statusLabels.${order.status}`)} - {t(`orders.paymentStatusLabels.${order.paymentStatus}`)}
                  </Typography>
                </Box>
                <ChevronRight className="h-4 w-4 text-teal-600 dark:text-teal-300" />
              </Box>
            ) : null}

            <Box
              layoutClassName="mb-3 grid grid-cols-1 gap-2 rounded-lg p-3"
              backgroundClassName="bg-slate-50 dark:bg-slate-700/40"
            >
              <Box layoutClassName="flex items-center gap-2">
                <Box
                  layoutClassName="flex h-7 w-7 shrink-0 items-center justify-center text-slate-500 dark:text-slate-400"
                  roundedClassName="rounded-full"
                  borderClassName="border border-slate-200 dark:border-slate-600"
                  backgroundClassName="bg-white dark:bg-slate-700"
                >
                  <User className="h-3.5 w-3.5" />
                </Box>
                <Box layoutClassName="min-w-0">
                  <Typography size="xs" variant="muted">Khách hàng</Typography>
                  <Typography size="sm" layoutClassName="truncate font-medium">{order.customer.name}</Typography>
                  <Typography size="xs" variant="muted" layoutClassName="truncate">
                    {order.customer.phone || order.customer.email || '--'}
                  </Typography>
                  <Typography size="xs" variant="muted" layoutClassName="line-clamp-1">
                    {order.customer.address || '--'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box layoutClassName="flex items-center justify-between border-t pt-3" borderClassName="border-slate-100 dark:border-slate-700">
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
                  layoutClassName="px-2 py-0.5 text-[11px] font-semibold uppercase"
                  borderClassName="border-transparent"
                  className={PAYMENT_STATUS_COLORS[order.paymentStatus]}
                >
                  {t(`orders.paymentStatusLabels.${order.paymentStatus}`)}
                </Badge>
              </Box>
            </Box>

            <Typography as="span" size="xs" variant="muted" layoutClassName="mt-2 block">
              {t('orders.labelCreated')}: {formatDateTime(order.createdAt)}
            </Typography>
          </Card>
        ))
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
  );
};

export default OrderListMobile;

import React from 'react';
import { Calendar, Package, User } from 'lucide-react';
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
          >
            <Box layoutClassName="mb-3 flex items-center justify-between">
              <Box>
                <Typography
                  as="span"
                  size="sm"
                  layoutClassName="font-bold"
                  textClassName="text-orange-600 dark:text-orange-400"
                  title={order.id}
                >
                  #{order.orderNumber}
                </Typography>
                <Box layoutClassName="mt-1 flex items-center text-xs text-slate-400 dark:text-slate-500">
                  <Calendar className="mr-1 h-3 w-3" />
                  {new Date(order.createdAt.toDate()).toLocaleDateString()}
                </Box>
                {order.deliveryDate ? (
                  <Box layoutClassName="flex items-center text-xs text-slate-400 dark:text-slate-500">
                    <Calendar className="mr-1 h-3 w-3" />
                    {`${t('orders.tableDeliveryDate')}: ${formatDateOnly(order.deliveryDate)}`}
                    {order.deliveryTime ? ` • ${order.deliveryTime}` : ''}
                  </Box>
                ) : null}
              </Box>
              <Box layoutClassName="flex flex-col items-center gap-1">
                <Typography
                  as="span"
                  layoutClassName="text-[11px] font-semibold text-slate-500 dark:text-slate-400"
                >
                  {t('orders.tableStatus')}
                </Typography>
                <Badge
                  size="sm"
                  layoutClassName="px-2.5 py-1 text-xs font-medium"
                  borderClassName="border-transparent"
                  className={STATUS_COLORS[order.status]}
                >
                  {t(`orders.statusLabels.${order.status}`)}
                </Badge>
              </Box>
            </Box>

            <Box
              layoutClassName="mb-4 flex flex-col gap-2 rounded-lg p-3"
              backgroundClassName="bg-slate-50 dark:bg-slate-700/50"
            >
              <Box layoutClassName="flex items-center gap-3">
                <Box
                  layoutClassName="flex h-8 w-8 shrink-0 items-center justify-center text-slate-500 dark:text-slate-400"
                  roundedClassName="rounded-full"
                  borderClassName="border border-slate-200 dark:border-slate-600"
                  backgroundClassName="bg-white dark:bg-slate-700"
                >
                  <User className="h-4 w-4" />
                </Box>
                <Box layoutClassName="flex flex-col">
                  <Typography size="sm" layoutClassName="line-clamp-1 font-medium">
                    {order.customer.name}
                  </Typography>
                  {(order.customer.email || order.customer.phone) && (
                    <Typography size="xs" variant="muted" layoutClassName="line-clamp-1">
                      {order.customer.email || order.customer.phone}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Box layoutClassName="flex items-center gap-3">
                <Box
                  layoutClassName="flex h-8 w-8 shrink-0 items-center justify-center text-slate-500 dark:text-slate-400"
                  roundedClassName="rounded-full"
                  borderClassName="border border-slate-200 dark:border-slate-600"
                  backgroundClassName="bg-white dark:bg-slate-700"
                >
                  <Package className="h-4 w-4" />
                </Box>
                <Box layoutClassName="text-sm text-slate-700 dark:text-slate-300">{renderProductSummary(order)}</Box>
              </Box>

              <Box
                layoutClassName="mt-1 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-600"
              >
                <Typography size="xs" variant="muted">
                  {t('orders.tableTotal')}
                </Typography>
                <Typography size="sm" layoutClassName="font-bold text-slate-900 dark:text-white">
                  {formatVND(order.total)}
                </Typography>
              </Box>
            </Box>
            <Box layoutClassName="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
              <Box layoutClassName="flex flex-col gap-1">
                <Typography
                  as="span"
                  layoutClassName="text-[11px] font-semibold text-slate-500 dark:text-slate-400"
                >
                  {t('detail.payment')}
                </Typography>
                <Badge
                  size="sm"
                  layoutClassName="inline-flex w-fit px-2 py-1 text-[11px] font-semibold whitespace-nowrap"
                  borderClassName="border-transparent"
                  className={PAYMENT_STATUS_COLORS[order.paymentStatus]}
                >
                  {t(`orders.paymentStatusLabels.${order.paymentStatus}`)}
                </Badge>
              </Box>
              <Box layoutClassName="flex flex-col gap-1">
                <Typography
                  as="span"
                  layoutClassName="text-[11px] font-semibold text-slate-500 dark:text-slate-400"
                >
                  {t('detail.paymentMethod')}
                </Typography>
                <Badge
                  size="sm"
                  layoutClassName="inline-flex w-fit px-2 py-1 text-[11px] font-semibold"
                  borderClassName="border-transparent"
                  className={PAYMENT_METHOD_COLORS[order.paymentMethod]}
                >
                  {order.paymentMethod === 'BANKING' ? t('paymentMethod.banking') : t('paymentMethod.cash')}
                </Badge>
              </Box>

              <Typography as="span" size="xs" layoutClassName="block">
                {t('orders.labelCreated')}: {formatDateTime(order.createdAt)}{' '}
                {order.createdBy ? `(${order.createdBy})` : ''}
              </Typography>
              <Typography as="span" size="xs" layoutClassName="block">
                {t('orders.labelUpdated')}: {formatDateTime(order.updatedAt)}{' '}
                {order.updatedBy ? `(${order.updatedBy})` : ''}
              </Typography>
            </Box>
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

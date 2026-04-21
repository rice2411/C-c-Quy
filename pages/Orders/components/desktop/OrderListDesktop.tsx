import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PAYMENT_METHOD_COLORS, PAYMENT_STATUS_COLORS, STATUS_COLORS } from '@/constant/order';
import { useLanguage } from '@/contexts/LanguageContext';
import { Order } from '@/types';
import { formatVND } from '@/utils/currencyUtil';
import { formatDateOnly, formatDateTime } from '@/utils/dateUtil';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/Table';
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

  const SortIcon = ({ field }: { field: keyof Order }) => {
    if (sortField !== field) {
      return <Box layoutClassName="ml-1 h-4 w-4 opacity-0 group-hover:opacity-30" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4" />
    );
  };

  return (
    <Box layoutClassName="hidden flex-1 overflow-auto lg:block">
      <Table>
        <TableHead
          layoutClassName="sticky top-0 z-10"
          backgroundClassName="bg-slate-100 dark:bg-slate-700"
          shadowClassName="shadow-sm"
        >
          <TableRow
            borderClassName="border-b border-slate-200 dark:border-slate-600"
            textClassName="text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
          >
            <TableHeaderCell
              layoutClassName="group w-36 cursor-pointer py-5 transition-colors"
              hoverClassName="hover:bg-slate-200 dark:hover:bg-slate-600"
              textClassName="text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
              onClick={() => onSort('orderNumber')}
            >
              <Box layoutClassName="flex items-center">
                Order Number <SortIcon field="orderNumber" />
              </Box>
            </TableHeaderCell>
            <TableHeaderCell layoutClassName="w-1/4 py-5">{t('orders.tableCustomer')}</TableHeaderCell>
            <TableHeaderCell layoutClassName="w-1/5 py-5">{t('orders.tableProduct')}</TableHeaderCell>
            <TableHeaderCell
              layoutClassName="cursor-pointer whitespace-nowrap py-5 transition-colors group"
              hoverClassName="hover:bg-slate-200 dark:hover:bg-slate-600"
              textClassName="text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
              onClick={() => onSort('date')}
            >
              <Box layoutClassName="flex items-center">
                {t('orders.tableDate')} <SortIcon field="date" />
              </Box>
            </TableHeaderCell>
            <TableHeaderCell layoutClassName="whitespace-nowrap py-5">
              {t('orders.tableDeliveryDate') ?? 'Ngày giao'}
            </TableHeaderCell>
            <TableHeaderCell layoutClassName="whitespace-nowrap py-5">{t('orders.tableCreatedUpdated')}</TableHeaderCell>
            <TableHeaderCell
              layoutClassName="cursor-pointer whitespace-nowrap py-5 transition-colors group"
              hoverClassName="hover:bg-slate-200 dark:hover:bg-slate-600"
              textClassName="text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
              onClick={() => onSort('paymentMethod')}
            >
              <Box layoutClassName="flex items-center gap-1">{t('detail.paymentMethod')}</Box>
            </TableHeaderCell>
            <TableHeaderCell
              layoutClassName="cursor-pointer whitespace-nowrap py-5 transition-colors group"
              hoverClassName="hover:bg-slate-200 dark:hover:bg-slate-600"
              textClassName="text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
              onClick={() => onSort('status')}
            >
              <Box layoutClassName="flex items-center">
                {t('orders.tableStatus')} <SortIcon field="status" />
              </Box>
            </TableHeaderCell>
            <TableHeaderCell
              layoutClassName="cursor-pointer whitespace-nowrap py-5 transition-colors group"
              hoverClassName="hover:bg-slate-200 dark:hover:bg-slate-600"
              textClassName="text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
              onClick={() => onSort('paymentStatus')}
            >
              <Box layoutClassName="flex items-center">
                {t('detail.payment')} <SortIcon field="paymentStatus" />
              </Box>
            </TableHeaderCell>
            <TableHeaderCell
              layoutClassName="cursor-pointer py-5 text-right whitespace-nowrap transition-colors group"
              hoverClassName="hover:bg-slate-200 dark:hover:bg-slate-600"
              textClassName="text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
              onClick={() => onSort('total')}
            >
              <Box layoutClassName="flex items-center justify-end">
                {t('orders.tableTotal')} <SortIcon field="total" />
              </Box>
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.length > 0 ? (
            orders.map((order) => (
              <TableRow
                key={order.id}
                hoverClassName="hover:bg-slate-50/80 dark:hover:bg-slate-700/30"
                stateClassName="cursor-pointer transition-colors group"
                onClick={() => onSelectOrder(order)}
              >
                <TableCell layoutClassName="py-5">
                  <Typography
                    as="span"
                    size="sm"
                    layoutClassName="font-mono font-medium"
                    textClassName="text-orange-600 dark:text-orange-400"
                    title={order.id}
                  >
                    {order.orderNumber || order.id.substring(0, 6)}
                  </Typography>
                </TableCell>
                <TableCell layoutClassName="py-5">
                  <Box layoutClassName="flex flex-col">
                    <Typography
                      as="span"
                      size="sm"
                      layoutClassName="line-clamp-1 font-medium"
                      title={order.customer.name}
                    >
                      {order.customer.name}
                    </Typography>
                    <Typography
                      as="span"
                      size="xs"
                      variant="muted"
                      layoutClassName="max-w-[150px] truncate"
                    >
                      {order.customer.email || order.customer.phone}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell layoutClassName="py-5 text-sm">{renderProductSummary(order)}</TableCell>
                <TableCell
                  layoutClassName="whitespace-nowrap py-5 text-sm"
                  textClassName="text-slate-600 dark:text-slate-400"
                >
                  {formatDateOnly(order.orderDate || order.date)}
                </TableCell>
                <TableCell
                  layoutClassName="whitespace-nowrap py-5 text-sm"
                  textClassName="text-slate-600 dark:text-slate-400"
                >
                  {order.deliveryDate ? (
                    <Box layoutClassName="flex flex-col gap-1">
                      <Typography as="span" size="sm" variant="secondary">
                        {formatDateOnly(order.deliveryDate)}
                      </Typography>
                      {order.deliveryTime ? (
                        <Typography as="span" size="xs" variant="muted">
                          {order.deliveryTime}
                        </Typography>
                      ) : null}
                    </Box>
                  ) : (
                    <Typography as="span" size="xs" variant="muted">
                      --
                    </Typography>
                  )}
                </TableCell>
                <TableCell
                  layoutClassName="whitespace-nowrap py-5 text-xs"
                  textClassName="text-slate-600 dark:text-slate-400"
                >
                  <Box layoutClassName="flex flex-col gap-1">
                    <Box layoutClassName="flex items-center gap-1">
                      <Typography as="span" size="xs" layoutClassName="font-semibold text-slate-700 dark:text-slate-200">
                        {t('orders.labelCreated')}:
                      </Typography>
                      <span>{formatDateTime(order.createdAt || order.orderDate || order.date)}</span>
                      {order.createdBy ? (
                        <Typography as="span" size="xs" variant="muted" layoutClassName="italic">
                          ({order.createdBy})
                        </Typography>
                      ) : null}
                    </Box>
                    <Box layoutClassName="flex items-center gap-1">
                      <Typography as="span" size="xs" layoutClassName="font-semibold text-slate-700 dark:text-slate-200">
                        {t('orders.labelUpdated')}:
                      </Typography>
                      <span>{formatDateTime(order.updatedAt)}</span>
                      {order.updatedBy ? (
                        <Typography as="span" size="xs" variant="muted" layoutClassName="italic">
                          ({order.updatedBy})
                        </Typography>
                      ) : null}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell layoutClassName="whitespace-nowrap py-5">
                  <Badge
                    size="sm"
                    layoutClassName="whitespace-nowrap px-2.5 py-1 text-xs font-semibold"
                    borderClassName="border-transparent"
                    className={PAYMENT_METHOD_COLORS[order.paymentMethod]}
                  >
                    {order.paymentMethod === 'BANKING' ? t('paymentMethod.banking') : t('paymentMethod.cash')}
                  </Badge>
                </TableCell>
                <TableCell layoutClassName="py-5">
                  <Badge
                    size="sm"
                    layoutClassName="whitespace-nowrap px-2.5 py-1 text-xs font-medium"
                    borderClassName="border-transparent"
                    className={STATUS_COLORS[order.status]}
                  >
                    {t(`orders.statusLabels.${order.status}`)}
                  </Badge>
                </TableCell>
                <TableCell layoutClassName="py-5">
                  <Badge
                    size="sm"
                    layoutClassName="whitespace-nowrap px-2.5 py-1 text-xs font-bold uppercase"
                    borderClassName="border-transparent"
                    className={PAYMENT_STATUS_COLORS[order.paymentStatus]}
                  >
                    {t(`orders.paymentStatusLabels.${order.paymentStatus}`)}
                  </Badge>
                </TableCell>
                <TableCell
                  layoutClassName="py-5 text-right font-medium whitespace-nowrap"
                  textClassName="text-slate-900 dark:text-white"
                >
                  {formatVND(order.total)}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={10}
                layoutClassName="px-6 py-12 text-center"
                textClassName="text-slate-400 dark:text-slate-500"
              >
                {t('orders.noOrdersCriteria')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  );
};

export default OrderListDesktop;

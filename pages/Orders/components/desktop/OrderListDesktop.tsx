import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Order } from '@/types';
import { PAYMENT_METHOD_COLORS, PAYMENT_STATUS_COLORS, STATUS_COLORS } from '@/constant/order';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatVND } from '@/utils/currencyUtil';
import { formatDateOnly, formatDateTime } from '@/utils/dateUtil';

interface OrderListDesktopProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  renderProductSummary: (order: Order) => React.ReactNode;
  sortField: keyof Order;
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof Order) => void;
}

// Desktop table view extracted to keep OrderList concise
const OrderListDesktop: React.FC<OrderListDesktopProps> = ({
  orders,
  onSelectOrder,
  renderProductSummary,
  sortField,
  sortDirection,
  onSort,
}) => {
  const { t } = useLanguage();

  const SortIcon = ({ field }: { field: keyof Order }) => {
    if (sortField !== field) {
      return <div className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-30" />;
    }
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />;
  };

  return (
    <div className="hidden lg:block flex-1 overflow-auto">
      <table className="w-full text-left border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-700 shadow-sm">
          <tr className="text-slate-600 dark:text-slate-300 text-sm font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-600">
            <th
              className="px-6 py-5 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 group w-36 transition-colors"
              onClick={() => onSort('orderNumber')}
            >
              <div className="flex items-center">Order Number <SortIcon field="orderNumber" /></div>
            </th>
            <th className="px-6 py-5 w-1/4">{t('orders.tableCustomer')}</th>
            <th className="px-6 py-5 w-1/5">{t('orders.tableProduct')}</th>
            <th
              className="px-6 py-5 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 group whitespace-nowrap transition-colors"
              onClick={() => onSort('date')}
            >
              <div className="flex items-center">{t('orders.tableDate')} <SortIcon field="date" /></div>
            </th>
            <th className="px-6 py-5 whitespace-nowrap">{t('orders.tableDeliveryDate') ?? 'Ngày giao'}</th>
            <th className="px-6 py-5 whitespace-nowrap">{t('orders.tableCreatedUpdated')}</th>
            <th
              className="px-6 py-5 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 group whitespace-nowrap transition-colors"
              onClick={() => onSort('paymentMethod')}
            >
              <div className="flex items-center gap-1">{t('detail.paymentMethod')}</div>
            </th>
            <th
              className="px-6 py-5 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 group whitespace-nowrap transition-colors"
              onClick={() => onSort('status')}
            >
              <div className="flex items-center">{t('orders.tableStatus')} <SortIcon field="status" /></div>
            </th>
            <th
              className="px-6 py-5 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 group whitespace-nowrap transition-colors"
              onClick={() => onSort('paymentStatus')}
            >
              <div className="flex items-center">{t('detail.payment')} <SortIcon field="paymentStatus" /></div>
            </th>
            <th
              className="px-6 py-5 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 group text-right whitespace-nowrap transition-colors"
              onClick={() => onSort('total')}
            >
              <div className="flex items-center justify-end">{t('orders.tableTotal')} <SortIcon field="total" /></div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
          {orders.length > 0 ? (
            orders.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors group cursor-pointer"
                onClick={() => onSelectOrder(order)}
              >
                <td className="px-6 py-5">
                  <span className="font-medium text-orange-600 dark:text-orange-400 font-mono" title={order.id}>
                    {order.orderNumber || order.id.substring(0, 6)}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-slate-900 dark:text-white font-medium text-sm line-clamp-1" title={order.customer.name}>
                      {order.customer.name}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 text-xs truncate max-w-[150px]">
                      {order.customer.email || order.customer.phone}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5 text-sm">
                  {renderProductSummary(order)}
                </td>
                <td className="px-6 py-5 text-slate-600 dark:text-slate-400 text-sm whitespace-nowrap">
                  {formatDateOnly(order.orderDate || order.date)}
                </td>
                <td className="px-6 py-5 text-slate-600 dark:text-slate-400 text-sm whitespace-nowrap">
                  {order.deliveryDate ? (
                    <div className="flex flex-col gap-1">
                      <span>{formatDateOnly(order.deliveryDate)}</span>
                      {order.deliveryTime && <span className="text-xs text-slate-500">{order.deliveryTime}</span>}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">--</span>
                  )}
                </td>
                <td className="px-6 py-5 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{t('orders.labelCreated')}:</span>
                      <span>{formatDateTime(order.createdAt || order.orderDate || order.date)}</span>
                      {order.createdBy && <span className="italic text-slate-500">({order.createdBy})</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{t('orders.labelUpdated')}:</span>
                      <span>{formatDateTime(order.updatedAt)}</span>
                      {order.updatedBy && <span className="italic text-slate-500">({order.updatedBy})</span>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border border-transparent ${PAYMENT_METHOD_COLORS[order.paymentMethod]}`}>
                    {order.paymentMethod === 'BANKING' ? t('paymentMethod.banking') : t('paymentMethod.cash')}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border border-transparent ${STATUS_COLORS[order.status]} whitespace-nowrap`}>
                    {t(`orders.statusLabels.${order.status}`)}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border border-transparent ${PAYMENT_STATUS_COLORS[order.paymentStatus]} whitespace-nowrap`}>
                    {t(`orders.paymentStatusLabels.${order.paymentStatus}`)}
                  </span>
                </td>
                <td className="px-6 py-5 text-right font-medium text-slate-900 dark:text-white whitespace-nowrap">
                  {formatVND(order.total)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={10} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                {t('orders.noOrdersCriteria')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OrderListDesktop;


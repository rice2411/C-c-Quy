import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronRight, Clock, Truck, Wallet } from 'lucide-react';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';
import { Order, OrderStatus, PaymentStatus } from '@/types';
import { formatVND } from '@/utils/format/currencyUtil';
import { parseDateValue } from '@/utils/format/dateUtil';
import { getOrderTotal } from '@/utils/order/orderUtils';

import Button from '@/components/ui/Button';
interface DashboardAlertsProps {
  orders: Order[];
}

/**
 * Critical alerts banner — hiện đầu Dashboard cho chủ tiệm quick-glance:
 *   - Đơn quá hạn cần xử lý (PENDING/PROCESSING + deliveryDate < hôm nay)
 *   - Đơn chưa thanh toán (UNPAID & không bị CANCELLED) + tổng tiền
 *   - Đơn cần ship hôm nay (PENDING/PROCESSING + deliveryDate === hôm nay)
 *
 * Mỗi alert click → /orders?quick=<key> pre-apply filter tương ứng.
 */
const DashboardAlerts: React.FC<DashboardAlertsProps> = ({ orders }) => {
  const navigate = useNavigate();

  const { overdueCount, unpaidCount, unpaidTotal, shipTodayCount } = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setHours(23, 59, 59, 999);

    let overdue = 0;
    let unpaid = 0;
    let unpaidSum = 0;
    let shipToday = 0;

    for (const o of orders) {
      const isProcessing =
        o.status === OrderStatus.PENDING || o.status === OrderStatus.PROCESSING;
      const isClosed =
        o.status === OrderStatus.CANCELLED || o.status === OrderStatus.RETURNED;
      const dd = parseDateValue(o.deliveryDate);

      if (isProcessing && dd) {
        if (dd.getTime() < startOfToday.getTime()) overdue++;
        else if (dd.getTime() >= startOfToday.getTime() && dd.getTime() <= endOfToday.getTime()) {
          shipToday++;
        }
      }

      if (o.paymentStatus === PaymentStatus.UNPAID && !isClosed) {
        unpaid++;
        unpaidSum += getOrderTotal(o);
      }
    }

    return {
      overdueCount: overdue,
      unpaidCount: unpaid,
      unpaidTotal: unpaidSum,
      shipTodayCount: shipToday,
    };
  }, [orders]);

  const items: {
    key: 'overdue' | 'unpaid' | 'today';
    icon: React.ReactNode;
    title: string;
    detail: string;
    tone: 'red' | 'amber' | 'blue';
    count: number;
  }[] = [];

  if (overdueCount > 0) {
    items.push({
      key: 'overdue',
      icon: <AlertTriangle className="h-5 w-5" />,
      title: `${overdueCount} đơn quá hạn`,
      detail: 'Đơn đang xử lý đã qua ngày giao',
      tone: 'red',
      count: overdueCount,
    });
  }
  if (shipTodayCount > 0) {
    items.push({
      key: 'today',
      icon: <Truck className="h-5 w-5" />,
      title: `${shipTodayCount} đơn ship hôm nay`,
      detail: 'Cần chuẩn bị giao trong ngày',
      tone: 'blue',
      count: shipTodayCount,
    });
  }
  if (unpaidCount > 0) {
    items.push({
      key: 'unpaid',
      icon: <Wallet className="h-5 w-5" />,
      title: `${unpaidCount} đơn chưa thanh toán`,
      detail: `Tổng ${formatVND(unpaidTotal)}`,
      tone: 'amber',
      count: unpaidCount,
    });
  }

  if (items.length === 0) {
    return null;
  }

  const toneClass = (tone: 'red' | 'amber' | 'blue') => {
    if (tone === 'red')
      return 'border-red-200 bg-red-50 text-red-800 hover:border-red-300 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200';
    if (tone === 'amber')
      return 'border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200';
    return 'border-blue-200 bg-blue-50 text-blue-800 hover:border-blue-300 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
  };

  return (
    <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <Button
          key={it.key}
          type="button"
          onClick={() => navigate(`/orders?quick=${it.key}`)}
          className={`group flex items-center gap-3 rounded-xl border p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${toneClass(
            it.tone,
          )}`}
         variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/60 dark:bg-slate-900/30">
            {it.icon}
          </span>
          <Box layoutClassName="min-w-0 flex-1">
            <Typography as="div" size="sm" textClassName="font-bold">
              {it.title}
            </Typography>
            <Typography as="div" size="xs" layoutClassName="opacity-80">
              {it.detail}
            </Typography>
          </Box>
          <ChevronRight className="h-5 w-5 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5" />
        </Button>
      ))}
    </Box>
  );
};

export default DashboardAlerts;

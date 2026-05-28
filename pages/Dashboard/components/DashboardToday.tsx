import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, DollarSign, Package, TrendingDown, TrendingUp, Truck } from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import { Order, OrderStatus, PaymentStatus } from '@/types';
import { formatVND } from '@/utils/format/currencyUtil';
import { parseDateValue } from '@/utils/format/dateUtil';
import { getOrderRevenueDate, getOrderTotal } from '@/utils/order/orderUtils';

import Button from '@/components/ui/Button';
interface DashboardTodayProps {
  orders: Order[];
}

/**
 * "Morning glance" card — focus HÔM NAY, không phải tuần/tháng.
 * 4 mini-stat: Doanh thu / Đơn mới / Đã giao / Cần ship.
 * Mỗi số kèm so sánh hôm qua (+% hoặc -%).
 * Click → /orders?quick=<key> với filter tương ứng.
 */
const DashboardToday: React.FC<DashboardTodayProps> = ({ orders }) => {
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);
    const endToday = new Date(startToday);
    endToday.setHours(23, 59, 59, 999);
    const startYesterday = new Date(startToday);
    startYesterday.setDate(startYesterday.getDate() - 1);
    const endYesterday = new Date(endToday);
    endYesterday.setDate(endYesterday.getDate() - 1);

    let revenueToday = 0;
    let revenueYesterday = 0;
    let newToday = 0;
    let newYesterday = 0;
    let deliveredToday = 0;
    let deliveredYesterday = 0;
    let shipToday = 0;

    for (const o of orders) {
      const created = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt as any);
      // Mốc doanh thu: ưu tiên deliveryDate, fallback createdAt
      const revDate = getOrderRevenueDate(o);
      const isPaidDelivered =
        o.paymentStatus === PaymentStatus.PAID && o.status === OrderStatus.DELIVERED;

      // Đơn mới (theo ngày TẠO — không đổi)
      if (created >= startToday && created <= endToday) newToday++;
      else if (created >= startYesterday && created <= endYesterday) newYesterday++;

      // Doanh thu (PAID+DELIVERED, theo deliveryDate || createdAt)
      if (isPaidDelivered && revDate) {
        if (revDate >= startToday && revDate <= endToday) revenueToday += getOrderTotal(o);
        else if (revDate >= startYesterday && revDate <= endYesterday)
          revenueYesterday += getOrderTotal(o);
      }

      // Đã giao trong ngày (theo deliveryDate khi status=DELIVERED)
      if (o.status === OrderStatus.DELIVERED) {
        const dd = parseDateValue(o.deliveryDate);
        if (dd) {
          if (dd >= startToday && dd <= endToday) deliveredToday++;
          else if (dd >= startYesterday && dd <= endYesterday) deliveredYesterday++;
        }
      }

      // Cần ship hôm nay (PENDING/PROCESSING + deliveryDate=today)
      const isProcessing =
        o.status === OrderStatus.PENDING || o.status === OrderStatus.PROCESSING;
      if (isProcessing) {
        const dd = parseDateValue(o.deliveryDate);
        if (dd && dd >= startToday && dd <= endToday) shipToday++;
      }
    }

    return {
      revenueToday,
      revenueYesterday,
      newToday,
      newYesterday,
      deliveredToday,
      deliveredYesterday,
      shipToday,
    };
  }, [orders]);

  const pctDiff = (cur: number, prev: number): number | null => {
    if (prev === 0 && cur === 0) return 0;
    if (prev === 0) return 100;
    return Math.round(((cur - prev) / prev) * 100);
  };

  const items: {
    key: string;
    icon: React.ReactNode;
    label: string;
    value: string;
    diff: number | null;
    onClick?: () => void;
    accent: string;
  }[] = [
    {
      key: 'revenue',
      icon: <DollarSign className="h-4 w-4" />,
      label: 'Doanh thu hôm nay',
      value: formatVND(stats.revenueToday),
      diff: pctDiff(stats.revenueToday, stats.revenueYesterday),
      onClick: () => navigate('/orders?quick=paid'),
      accent: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300',
    },
    {
      key: 'new',
      icon: <Package className="h-4 w-4" />,
      label: 'Đơn mới',
      value: String(stats.newToday),
      diff: pctDiff(stats.newToday, stats.newYesterday),
      onClick: () => navigate('/orders'),
      accent: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300',
    },
    {
      key: 'delivered',
      icon: <CheckCircle2 className="h-4 w-4" />,
      label: 'Đã giao',
      value: String(stats.deliveredToday),
      diff: pctDiff(stats.deliveredToday, stats.deliveredYesterday),
      accent: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-300',
    },
    {
      key: 'ship',
      icon: <Truck className="h-4 w-4" />,
      label: 'Cần ship',
      value: String(stats.shipToday),
      diff: null,
      onClick: () => navigate('/orders?quick=today'),
      accent: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-300',
    },
  ];

  return (
    <Card padding="none" layoutClassName="overflow-hidden">
      <Box
        layoutClassName="flex items-center justify-between border-b px-5 py-3"
        borderClassName="border-slate-100 dark:border-slate-700"
        backgroundClassName="bg-slate-50/50 dark:bg-slate-900/30"
      >
        <Typography as="span" size="sm" layoutClassName="font-semibold uppercase tracking-wide" textClassName="text-slate-700 dark:text-slate-200">
          Hôm nay
        </Typography>
        <Typography as="span" size="xs" variant="muted">
          So với hôm qua
        </Typography>
      </Box>
      <Box layoutClassName="grid grid-cols-2 sm:grid-cols-4">
        {items.map((it, idx) => {
          const diff = it.diff;
          const diffPositive = diff != null && diff > 0;
          const diffNegative = diff != null && diff < 0;
          const DiffIcon = diffPositive ? TrendingUp : diffNegative ? TrendingDown : null;
          const diffColor = diffPositive
            ? 'text-emerald-600 dark:text-emerald-400'
            : diffNegative
              ? 'text-red-500 dark:text-red-400'
              : 'text-slate-400 dark:text-slate-500';
          return (
            <Button
              key={it.key}
              type="button"
              onClick={it.onClick}
              disabled={!it.onClick}
              className={`group flex flex-col gap-1 border-slate-100 px-5 py-4 text-left transition-colors dark:border-slate-700 ${
                idx < 3 ? 'border-b sm:border-b-0 sm:border-r' : ''
              } ${idx < 2 ? 'border-r sm:border-r' : 'sm:border-r-0'} ${
                it.onClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40' : 'cursor-default'
              }`}
             variant="ghost" disableVariantHover disableVariantTextColor borderClassName="border-transparent">
              <Box layoutClassName="flex items-center gap-2">
                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${it.accent}`}>
                  {it.icon}
                </span>
                <Typography as="span" size="xs" variant="muted" layoutClassName="truncate">
                  {it.label}
                </Typography>
              </Box>
              <Typography as="div" size="lg" textClassName="font-bold text-slate-900 dark:text-white" layoutClassName="tabular-nums">
                {it.value}
              </Typography>
              {diff != null ? (
                <Box layoutClassName={`flex items-center gap-1 text-xs ${diffColor}`}>
                  {DiffIcon ? <DiffIcon className="h-3 w-3" /> : null}
                  <span className="font-medium">
                    {diffPositive ? '+' : ''}
                    {diff}%
                  </span>
                </Box>
              ) : (
                <Typography as="span" size="xs" variant="muted" layoutClassName="opacity-0">
                  —
                </Typography>
              )}
            </Button>
          );
        })}
      </Box>
    </Card>
  );
};

export default DashboardToday;

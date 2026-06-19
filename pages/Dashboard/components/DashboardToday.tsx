import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, DollarSign, Package, TrendingDown, TrendingUp, Truck } from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import { Order, OrderStatus, PaymentStatus } from '@/types';
import { formatVND, formatVNDCompact } from '@/utils/format/currencyUtil';
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
      const createdRaw = o.createdAt?.toDate ? o.createdAt.toDate() : (o.createdAt ? new Date(o.createdAt as any) : null);
      // Guard Invalid Date → coi như không có ngày tạo (không tính vào today/yesterday)
      const created = createdRaw && !Number.isNaN(createdRaw.getTime()) ? createdRaw : null;
      // Mốc doanh thu: ưu tiên deliveryDate, fallback createdAt
      const revDate = getOrderRevenueDate(o);
      const isPaidDelivered =
        o.paymentStatus === PaymentStatus.PAID && o.status === OrderStatus.DELIVERED;

      // Đơn mới (theo ngày TẠO — không đổi)
      if (created) {
        if (created >= startToday && created <= endToday) newToday++;
        else if (created >= startYesterday && created <= endYesterday) newYesterday++;
      }

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

  // % chỉ có nghĩa khi CẢ hôm nay & hôm qua > 0:
  //   - hôm qua=0, hôm nay>0  → "mới"
  //   - hôm nay=0, hôm qua>0  → "↓ hôm qua: <mốc>" (đang thua, KHÔNG bịa -100%)
  //   - cả hai = 0            → "— so với hôm qua"
  const pctDiff = (cur: number, prev: number): number | null => {
    if (prev === 0 || cur === 0) return null;
    return Math.round(((cur - prev) / prev) * 100);
  };
  const isNew = (cur: number, prev: number): boolean => prev === 0 && cur > 0;
  const isBehind = (cur: number, prev: number): boolean => cur === 0 && prev > 0;

  const items: {
    key: string;
    icon: React.ReactNode;
    label: string;
    value: string;
    valueTitle?: string;
    diff: number | null;
    isNew: boolean;
    behind: boolean;
    compare: boolean;
    yesterdayLabel?: string;
    onClick?: () => void;
    iconBg: string;
    iconText: string;
  }[] = [
    {
      key: 'revenue',
      icon: <DollarSign className="h-4 w-4" />,
      label: 'Doanh thu',
      value: formatVNDCompact(stats.revenueToday),
      valueTitle: formatVND(stats.revenueToday),
      diff: pctDiff(stats.revenueToday, stats.revenueYesterday),
      isNew: isNew(stats.revenueToday, stats.revenueYesterday),
      behind: isBehind(stats.revenueToday, stats.revenueYesterday),
      compare: true,
      yesterdayLabel: formatVNDCompact(stats.revenueYesterday),
      onClick: () => navigate('/orders?quick=paid'),
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconText: 'text-emerald-600 dark:text-emerald-300',
    },
    {
      key: 'new',
      icon: <Package className="h-4 w-4" />,
      label: 'Đơn mới',
      value: String(stats.newToday),
      diff: pctDiff(stats.newToday, stats.newYesterday),
      isNew: isNew(stats.newToday, stats.newYesterday),
      behind: isBehind(stats.newToday, stats.newYesterday),
      compare: true,
      yesterdayLabel: String(stats.newYesterday),
      onClick: () => navigate('/orders'),
      iconBg: 'bg-blue-50 dark:bg-blue-900/20',
      iconText: 'text-blue-600 dark:text-blue-300',
    },
    {
      key: 'delivered',
      icon: <CheckCircle2 className="h-4 w-4" />,
      label: 'Đã giao',
      value: String(stats.deliveredToday),
      diff: pctDiff(stats.deliveredToday, stats.deliveredYesterday),
      isNew: isNew(stats.deliveredToday, stats.deliveredYesterday),
      behind: isBehind(stats.deliveredToday, stats.deliveredYesterday),
      compare: true,
      yesterdayLabel: String(stats.deliveredYesterday),
      iconBg: 'bg-violet-50 dark:bg-violet-900/20',
      iconText: 'text-violet-600 dark:text-violet-300',
    },
    {
      key: 'ship',
      icon: <Truck className="h-4 w-4" />,
      label: 'Cần ship',
      value: String(stats.shipToday),
      diff: null,
      isNew: false,
      behind: false,
      compare: false,
      onClick: () => navigate('/orders?quick=today'),
      iconBg: 'bg-primary-50 dark:bg-primary-900/20',
      iconText: 'text-primary-600 dark:text-primary-300',
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
      {/* Hairline grid: gap-px + nền = divider 1px đều cả ngang lẫn dọc, khỏi border theo idx */}
      <Box
        layoutClassName="grid grid-cols-2 gap-px sm:grid-cols-4"
        backgroundClassName="bg-slate-100 dark:bg-slate-700"
      >
        {items.map((it) => {
          const diff = it.diff;
          const diffPositive = diff != null && diff > 0;
          const diffNegative = diff != null && diff < 0;
          const DiffIcon = diffPositive ? TrendingUp : diffNegative ? TrendingDown : null;
          const diffColor = diffPositive
            ? 'text-emerald-600 dark:text-emerald-400'
            : diffNegative
              ? 'text-red-500 dark:text-red-400'
              : 'text-slate-400 dark:text-slate-500';

          const inner = (
            <>
              <Box layoutClassName="flex w-full min-w-0 items-center gap-2">
                <Box
                  layoutClassName="inline-flex h-7 w-7 shrink-0 items-center justify-center"
                  roundedClassName="rounded-lg"
                  backgroundClassName={it.iconBg}
                  textClassName={it.iconText}
                >
                  {it.icon}
                </Box>
                <Typography as="span" size="xs" variant="muted" layoutClassName="min-w-0 truncate">
                  {it.label}
                </Typography>
              </Box>
              <Typography
                as="div"
                size="lg"
                title={it.valueTitle ?? it.value}
                textClassName="font-bold text-slate-900 dark:text-white"
                layoutClassName="w-full min-w-0 max-w-full truncate tabular-nums"
              >
                {it.value}
              </Typography>
              {diff != null ? (
                <Box layoutClassName="flex items-center gap-1">
                  {DiffIcon ? <DiffIcon className={`h-3 w-3 ${diffColor}`} /> : null}
                  <Typography as="span" size="xs" textClassName={`font-medium ${diffColor}`}>
                    {diffPositive ? '+' : ''}
                    {diff}%
                  </Typography>
                </Box>
              ) : it.isNew ? (
                <Box layoutClassName="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  <Typography as="span" size="xs" textClassName="font-medium text-emerald-600 dark:text-emerald-400">
                    mới
                  </Typography>
                </Box>
              ) : it.behind ? (
                <Box
                  layoutClassName="flex w-full min-w-0 items-center gap-1"
                  title={`Hôm qua: ${it.yesterdayLabel}`}
                >
                  <TrendingDown className="h-3 w-3 shrink-0 text-red-500 dark:text-red-400" />
                  <Typography as="span" size="xs" textClassName="font-medium text-red-500 dark:text-red-400" layoutClassName="min-w-0 truncate">
                    {it.yesterdayLabel}
                  </Typography>
                </Box>
              ) : it.compare ? (
                <Typography as="span" size="xs" variant="muted">
                  — so với hôm qua
                </Typography>
              ) : (
                <Typography as="span" size="xs" variant="muted" layoutClassName="opacity-0">
                  —
                </Typography>
              )}
            </>
          );

          return it.onClick ? (
            <Button
              key={it.key}
              type="button"
              onClick={it.onClick}
              variant="ghost"
              disableVariantHover
              disableVariantTextColor
              layoutClassName="flex h-full min-w-0 flex-col items-start gap-1 px-4 py-4 text-left"
              backgroundClassName="bg-white dark:bg-slate-800"
              hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700/40"
              borderClassName="border-transparent"
              roundedClassName="rounded-none"
              shadowClassName="shadow-none"
              stateClassName="transition-colors cursor-pointer"
            >
              {inner}
            </Button>
          ) : (
            <Box
              key={it.key}
              layoutClassName="flex h-full min-w-0 flex-col items-start gap-1 px-4 py-4"
              backgroundClassName="bg-white dark:bg-slate-800"
            >
              {inner}
            </Box>
          );
        })}
      </Box>
    </Card>
  );
};

export default DashboardToday;

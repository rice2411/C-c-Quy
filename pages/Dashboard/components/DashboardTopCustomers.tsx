import React, { useMemo } from 'react';
import { Phone, User as UserIcon, Users } from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import { Order, OrderStatus, PaymentStatus } from '@/types';
import { formatVND } from '@/utils/format/currencyUtil';
import { getOrderTotal } from '@/utils/order/orderUtils';

interface DashboardTopCustomersProps {
  orders: Order[];
  startDate: Date;
  endDate: Date;
  limit?: number;
}

/**
 * Top khách hàng chi nhiều nhất trong period.
 * Aggregate đơn DELIVERED+PAID theo customer (key = phone hoặc name fallback).
 * Sort desc theo tổng chi tiêu, tie-break N đơn.
 */
const DashboardTopCustomers: React.FC<DashboardTopCustomersProps> = ({
  orders,
  startDate,
  endDate,
  limit = 5,
}) => {
  const topCustomers = useMemo(() => {
    const agg = new Map<
      string,
      { name: string; phone: string; orderCount: number; totalSpent: number }
    >();

    for (const o of orders) {
      if (o.paymentStatus !== PaymentStatus.PAID || o.status !== OrderStatus.DELIVERED) continue;
      const created = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt as any);
      if (created < startDate || created > endDate) continue;

      const phone = (o.customer?.phone || '').trim();
      const name = (o.customer?.name || '').trim();
      const key = phone || name || '(ẩn danh)';
      if (key === '(ẩn danh)' && !name && !phone) continue;

      const prev = agg.get(key) ?? {
        name: name || '(không tên)',
        phone,
        orderCount: 0,
        totalSpent: 0,
      };
      prev.orderCount += 1;
      prev.totalSpent += getOrderTotal(o);
      // Update name nếu trước đó rỗng
      if (!prev.name || prev.name === '(không tên)') prev.name = name || prev.name;
      agg.set(key, prev);
    }

    return Array.from(agg.values())
      .sort((a, b) => (b.totalSpent - a.totalSpent) || (b.orderCount - a.orderCount))
      .slice(0, limit);
  }, [orders, startDate, endDate, limit]);

  return (
    <Card padding="none" layoutClassName="flex flex-col overflow-hidden">
      <Box
        layoutClassName="flex shrink-0 items-center gap-2 border-b px-5 py-4"
        borderClassName="border-slate-100 dark:border-slate-700"
      >
        <Users className="h-5 w-5 text-violet-500" />
        <Heading level={3} textClassName="text-base font-semibold">
          Top khách hàng
        </Heading>
      </Box>

      <Box layoutClassName="flex-1 p-3">
        {topCustomers.length === 0 ? (
          <Box layoutClassName="flex h-full items-center justify-center p-6">
            <Typography as="span" size="sm" variant="muted" layoutClassName="text-center">
              Chưa có dữ liệu trong khoảng này
            </Typography>
          </Box>
        ) : (
          <Box layoutClassName="space-y-1.5">
            {topCustomers.map((c, idx) => (
              <Box
                key={c.phone + idx}
                layoutClassName="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-700"
              >
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 dark:bg-violet-900/40 dark:text-violet-200">
                  {idx + 1}
                </span>
                <Box layoutClassName="flex min-w-0 flex-1 flex-col">
                  <Box layoutClassName="flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <Typography
                      as="span"
                      size="sm"
                      layoutClassName="truncate font-semibold text-slate-900 dark:text-white"
                      title={c.name}
                    >
                      {c.name}
                    </Typography>
                  </Box>
                  {c.phone ? (
                    <Box layoutClassName="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                      <Typography as="span" size="xs" variant="muted" layoutClassName="font-mono">
                        {c.phone}
                      </Typography>
                    </Box>
                  ) : null}
                </Box>
                <Box layoutClassName="flex shrink-0 flex-col items-end text-right">
                  <Typography
                    as="span"
                    size="sm"
                    textClassName="font-bold text-violet-600 dark:text-violet-400"
                  >
                    {formatVND(c.totalSpent)}
                  </Typography>
                  <Typography as="span" size="xs" variant="muted">
                    {c.orderCount} đơn
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default DashboardTopCustomers;

import React, { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import { Order, OrderStatus, PaymentStatus } from '@/types';
import { formatVND } from '@/utils/format/currencyUtil';

interface DashboardTopProductsProps {
  orders: Order[];
  /** Khoảng thời gian đang xem (đồng bộ với DashboardChart period) */
  startDate: Date;
  endDate: Date;
  /** Số lượng top hiển thị — mặc định 5 */
  limit?: number;
}

/**
 * Top sản phẩm bán chạy nhất trong period.
 * Aggregate từ `order.items` của đơn DELIVERED + PAID trong khoảng [startDate, endDate].
 * Sort desc theo SỐ LƯỢNG bán (qty), tie-break bằng REVENUE.
 */
const DashboardTopProducts: React.FC<DashboardTopProductsProps> = ({
  orders,
  startDate,
  endDate,
  limit = 5,
}) => {
  const topProducts = useMemo(() => {
    const agg = new Map<string, { name: string; qty: number; revenue: number }>();

    for (const o of orders) {
      if (o.paymentStatus !== PaymentStatus.PAID || o.status !== OrderStatus.DELIVERED) continue;
      const created = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt as any);
      if (created < startDate || created > endDate) continue;
      if (!Array.isArray(o.items)) continue;
      for (const item of o.items) {
        const key = item.id || item.name;
        if (!key) continue;
        const prev = agg.get(key) ?? { name: item.name || '(không tên)', qty: 0, revenue: 0 };
        prev.qty += Number(item.quantity) || 0;
        prev.revenue += (Number(item.quantity) || 0) * (Number(item.price) || 0);
        agg.set(key, prev);
      }
    }

    return Array.from(agg.values())
      .sort((a, b) => (b.qty - a.qty) || (b.revenue - a.revenue))
      .slice(0, limit);
  }, [orders, startDate, endDate, limit]);

  return (
    <Card padding="none" layoutClassName="flex flex-col overflow-hidden">
      <Box
        layoutClassName="flex shrink-0 items-center gap-2 border-b px-5 py-4"
        borderClassName="border-slate-100 dark:border-slate-700"
      >
        <TrendingUp className="h-5 w-5 text-orange-500" />
        <Heading level={3} textClassName="text-base font-semibold">
          Top sản phẩm bán chạy
        </Heading>
      </Box>

      <Box layoutClassName="flex-1 p-3">
        {topProducts.length === 0 ? (
          <Box layoutClassName="flex h-full items-center justify-center p-6">
            <Typography as="span" size="sm" variant="muted" layoutClassName="text-center">
              Chưa có dữ liệu trong khoảng này
            </Typography>
          </Box>
        ) : (
          <Box layoutClassName="space-y-1.5">
            {topProducts.map((p, idx) => {
              const maxQty = topProducts[0]?.qty || 1;
              const widthPct = Math.max(8, Math.round((p.qty / maxQty) * 100));
              return (
                <Box
                  key={p.name + idx}
                  layoutClassName="relative overflow-hidden rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-700"
                >
                  {/* Bar background — visual rank */}
                  <Box
                    layoutClassName="absolute inset-y-0 left-0 bg-orange-50 dark:bg-orange-900/20"
                    stateClassName="transition-all"
                  >
                    <Box layoutClassName="h-full" />
                  </Box>
                  <Box layoutClassName="relative flex items-center justify-between gap-3">
                    <Box layoutClassName="flex min-w-0 items-center gap-2">
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700 dark:bg-orange-900/40 dark:text-orange-200">
                        {idx + 1}
                      </span>
                      <Typography
                        as="span"
                        size="sm"
                        layoutClassName="truncate font-medium"
                        title={p.name}
                      >
                        {p.name}
                      </Typography>
                    </Box>
                    <Box layoutClassName="flex shrink-0 items-center gap-3 text-right">
                      <Typography as="span" size="xs" variant="muted">
                        {p.qty} cái
                      </Typography>
                      <Typography
                        as="span"
                        size="sm"
                        textClassName="font-bold text-orange-600 dark:text-orange-400"
                      >
                        {formatVND(p.revenue)}
                      </Typography>
                    </Box>
                  </Box>
                  {/* Width-based fill effect on background */}
                  <style>{`.tp-bar-${idx}{width:${widthPct}%}`}</style>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default DashboardTopProducts;

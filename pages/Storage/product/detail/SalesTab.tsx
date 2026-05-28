/**
 * SalesTab — biểu đồ 30d + top buyers + metrics.
 */
import React from 'react';
import { formatVND } from '@/utils/format/currencyUtil';
import type { ProductSalesMetric } from '@/pages/Storage/product/productStats';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';

export interface DailySales {
  date: string;
  units: number;
  revenue: number;
}

export interface TopBuyer {
  name: string;
  count: number;
  units: number;
  revenue: number;
}

interface SalesTabProps {
  dailySales: DailySales[];
  metrics30: ProductSalesMetric | undefined;
  topBuyers: TopBuyer[];
}

const SalesTab: React.FC<SalesTabProps> = ({ dailySales, metrics30, topBuyers }) => {
  const max = Math.max(...dailySales.map((d) => d.units), 1);
  return (
    <Box layoutClassName="space-y-4">
      <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
        <Heading level={3} textClassName="text-sm font-bold uppercase tracking-wider">Biểu đồ 30 ngày</Heading>
        <Box layoutClassName="flex items-end gap-0.5 h-32 overflow-x-auto">
          {dailySales.map((d) => {
            const h = (d.units / max) * 100;
            return (
              <Box
                key={d.date}
                layoutClassName="group relative flex-1 min-w-[8px] rounded-t bg-orange-200 hover:bg-orange-400 dark:bg-orange-900/40 dark:hover:bg-orange-700 transition-colors"
                style={{ height: `${Math.max(h, 2)}%` }}
                title={`${d.date}: ${d.units} sp · ${formatVND(d.revenue)}`}
              >
                {d.units > 0 ? (
                  <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.units}
                  </span>
                ) : null}
              </Box>
            );
          })}
        </Box>
        <Box layoutClassName="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          <Box>
            <Typography size="xs" variant="muted">Tổng 30 ngày</Typography>
            <Typography size="sm" layoutClassName="font-bold">{metrics30?.unitsSold ?? 0} sp</Typography>
          </Box>
          <Box>
            <Typography size="xs" variant="muted">Doanh thu 30 ngày</Typography>
            <Typography size="sm" layoutClassName="font-bold text-orange-600">
              {formatVND(metrics30?.revenue ?? 0)}
            </Typography>
          </Box>
          <Box>
            <Typography size="xs" variant="muted">Tổng đơn</Typography>
            <Typography size="sm" layoutClassName="font-bold">{metrics30?.orderCount ?? 0}</Typography>
          </Box>
        </Box>
      </Card>

      <Card padding="md" borderClassName="border-slate-200 dark:border-slate-700" layoutClassName="space-y-3">
        <Heading level={3} textClassName="text-sm font-bold uppercase tracking-wider">Top khách mua</Heading>
        {topBuyers.length === 0 ? (
          <Typography size="sm" variant="muted">Chưa có khách nào mua sản phẩm này.</Typography>
        ) : (
          <Box layoutClassName="space-y-1.5">
            {topBuyers.map((b, idx) => (
              <Box
                key={idx}
                layoutClassName="flex items-center justify-between rounded-lg border border-slate-100 p-2 dark:border-slate-700"
              >
                <Box layoutClassName="flex items-center gap-2">
                  <Box layoutClassName="inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                    {idx + 1}
                  </Box>
                  <Box>
                    <Typography size="sm" layoutClassName="font-semibold">{b.name}</Typography>
                    <Typography size="xs" variant="muted">{b.count} đơn · {b.units} sp</Typography>
                  </Box>
                </Box>
                <Typography size="sm" layoutClassName="font-bold text-orange-600">{formatVND(b.revenue)}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Card>
    </Box>
  );
};

export default SalesTab;

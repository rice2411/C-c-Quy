import React, { useMemo } from 'react';
import { ListChecks } from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import EmptyState from '@/components/ui/EmptyState';
import { DonutChart, ChartLegend } from '@/components/ui/stats';
import { percentOf } from '@/utils/format/numberUtil';
import { Order, OrderStatus } from '@/types';

interface Props {
  orders: Order[];
  startDate: Date;
  endDate: Date;
  isDarkMode: boolean;
}

const META: Record<string, { label: string; color: string }> = {
  [OrderStatus.PENDING]: { label: 'Chờ xử lý', color: '#f59e0b' },
  [OrderStatus.PROCESSING]: { label: 'Đang làm', color: '#3b82f6' },
  [OrderStatus.DELIVERED]: { label: 'Đã giao', color: '#10b981' },
  [OrderStatus.CANCELLED]: { label: 'Đã huỷ', color: '#ef4444' },
  [OrderStatus.RETURNED]: { label: 'Hoàn', color: '#a855f7' },
};

/** Phân bố trạng thái đơn (theo createdAt trong kỳ). */
const DashboardOrderStatus: React.FC<Props> = ({ orders, startDate, endDate, isDarkMode }) => {
  const { data, legend, total } = useMemo(() => {
    const count: Record<string, number> = {};
    let t = 0;
    for (const o of orders) {
      const d = o.createdAt?.toDate ? o.createdAt.toDate() : null;
      if (!d || d < startDate || d > endDate) continue;
      const s = o.status || 'PENDING';
      count[s] = (count[s] || 0) + 1;
      t++;
    }
    // Donut: chỉ vẽ trạng thái có đơn (>0), sắp theo số lượng giảm dần
    const arr = Object.entries(count)
      .map(([k, v]) => ({ key: k, label: META[k]?.label ?? k, color: META[k]?.color ?? '#94a3b8', value: v }))
      .sort((a, b) => b.value - a.value);
    // Legend: hiện ĐỦ mọi trạng thái theo thứ tự cố định (0 đơn vẫn liệt kê, làm mờ)
    const full = Object.keys(META).map((k) => ({
      key: k,
      label: META[k].label,
      color: META[k].color,
      value: count[k] || 0,
    }));
    return { data: arr, legend: full, total: t };
  }, [orders, startDate, endDate]);

  return (
    <Card padding="none" layoutClassName="flex flex-col overflow-hidden">
      <Box layoutClassName="flex items-center gap-2 border-b px-5 py-4" borderClassName="border-slate-100 dark:border-slate-700">
        <ListChecks className="h-5 w-5 text-sky-500" />
        <Heading level={3} textClassName="text-lg font-semibold text-slate-800 dark:text-white">Trạng thái đơn</Heading>
        <Typography as="span" size="xs" variant="muted" layoutClassName="ml-auto">{total} đơn</Typography>
      </Box>
      {data.length === 0 ? (
        <EmptyState icon={<ListChecks className="h-6 w-6" />} title="Không có đơn trong kỳ." layoutClassName="flex-1" />
      ) : (
        <Box layoutClassName="flex items-center gap-4 p-5">
          <DonutChart data={data} formatValue={(v) => `${v} đơn`} isDarkMode={isDarkMode} />
          <Box layoutClassName="min-w-0 flex-1">
            <ChartLegend
              items={legend.map((d) => ({
                label: d.label,
                color: d.color,
                value: String(d.value),
                percent: percentOf(d.value, total),
                dim: d.value === 0,
              }))}
            />
          </Box>
        </Box>
      )}
    </Card>
  );
};

export default DashboardOrderStatus;

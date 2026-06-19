import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ListChecks } from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import EmptyState from '@/components/ui/EmptyState';
import DonutTooltip from '@/pages/Dashboard/components/DonutTooltip';
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
          <Box layoutClassName="h-40 w-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={42} outerRadius={66} paddingAngle={2}>
                  {data.map((d) => <Cell key={d.key} fill={d.color} />)}
                </Pie>
                <Tooltip content={<DonutTooltip isDarkMode={isDarkMode} formatValue={(v) => `${v} đơn`} />} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
          <Box layoutClassName="min-w-0 flex-1 space-y-1.5">
            {legend.map((d) => (
              <Box
                key={d.key}
                layoutClassName="flex items-center justify-between gap-2"
                stateClassName={d.value === 0 ? 'opacity-40' : ''}
              >
                <Box layoutClassName="flex items-center gap-2">
                  <Box layoutClassName="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <Typography as="span" size="sm" textClassName="text-slate-600 dark:text-slate-300">{d.label}</Typography>
                </Box>
                <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-slate-900 dark:text-white">{d.value} <Typography as="span" size="xs" variant="muted">({total ? Math.round((d.value / total) * 100) : 0}%)</Typography></Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Card>
  );
};

export default DashboardOrderStatus;

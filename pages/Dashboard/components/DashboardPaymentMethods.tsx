import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CreditCard } from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import DonutTooltip from '@/pages/Dashboard/components/DonutTooltip';
import { Order, PaymentMethod } from '@/types';
import { getOrderTotal } from '@/utils/order/orderUtils';
import { formatVND } from '@/utils/format/currencyUtil';

interface Props {
  orders: Order[];
  startDate: Date;
  endDate: Date;
  isDarkMode: boolean;
}

const META: Record<string, { label: string; color: string }> = {
  [PaymentMethod.CASH]: { label: 'Tiền mặt', color: '#10b981' },
  [PaymentMethod.BANKING]: { label: 'Chuyển khoản', color: '#6366f1' },
};

/** Cơ cấu phương thức thanh toán (theo doanh thu, đơn trong kỳ). */
const DashboardPaymentMethods: React.FC<Props> = ({ orders, startDate, endDate, isDarkMode }) => {
  const { data, legend, total } = useMemo(() => {
    const sum: Record<string, number> = {};
    let t = 0;
    for (const o of orders) {
      const d = o.createdAt?.toDate ? o.createdAt.toDate() : null;
      if (!d || d < startDate || d > endDate) continue;
      const m = o.paymentMethod || PaymentMethod.CASH;
      const amt = getOrderTotal(o);
      sum[m] = (sum[m] || 0) + amt;
      t += amt;
    }
    // Donut: chỉ vẽ phương thức có doanh thu (>0), sắp giảm dần
    const arr = Object.entries(sum)
      .map(([k, v]) => ({ key: k, label: META[k]?.label ?? k, color: META[k]?.color ?? '#94a3b8', value: v }))
      .sort((a, b) => b.value - a.value);
    // Legend: hiện ĐỦ mọi phương thức theo thứ tự cố định (0đ vẫn liệt kê, làm mờ)
    const full = Object.keys(META).map((k) => ({
      key: k,
      label: META[k].label,
      color: META[k].color,
      value: sum[k] || 0,
    }));
    return { data: arr, legend: full, total: t };
  }, [orders, startDate, endDate]);

  return (
    <Card padding="none" layoutClassName="flex flex-col overflow-hidden">
      <Box layoutClassName="flex items-center gap-2 border-b px-5 py-4" borderClassName="border-slate-100 dark:border-slate-700">
        <CreditCard className="h-5 w-5 text-indigo-500" />
        <Heading level={3} textClassName="text-lg font-semibold text-slate-800 dark:text-white">Phương thức thanh toán</Heading>
      </Box>
      {data.length === 0 ? (
        <Box layoutClassName="px-5 py-10"><Typography as="p" size="sm" variant="muted">Không có đơn trong kỳ.</Typography></Box>
      ) : (
        <Box layoutClassName="flex items-center gap-4 p-5">
          <Box layoutClassName="h-40 w-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={42} outerRadius={66} paddingAngle={2}>
                  {data.map((d) => <Cell key={d.key} fill={d.color} />)}
                </Pie>
                <Tooltip content={<DonutTooltip isDarkMode={isDarkMode} formatValue={formatVND} />} />
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
                <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-slate-900 dark:text-white">{formatVND(d.value)} <Typography as="span" size="xs" variant="muted">({total ? Math.round((d.value / total) * 100) : 0}%)</Typography></Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Card>
  );
};

export default DashboardPaymentMethods;

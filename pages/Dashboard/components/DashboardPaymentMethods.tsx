import React, { useMemo } from 'react';
import { CreditCard } from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import EmptyState from '@/components/ui/EmptyState';
import { DonutChart, ChartLegend } from '@/components/ui/stats';
import { Order, PaymentMethod } from '@/types';
import { getOrderTotal } from '@/utils/order/orderUtils';
import { formatVND } from '@/utils/format/currencyUtil';
import { percentOf } from '@/utils/format/numberUtil';

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
        <EmptyState icon={<CreditCard className="h-6 w-6" />} title="Không có đơn trong kỳ." layoutClassName="flex-1" />
      ) : (
        <Box layoutClassName="flex items-center gap-4 p-5">
          <DonutChart data={data} formatValue={formatVND} isDarkMode={isDarkMode} />
          <Box layoutClassName="min-w-0 flex-1">
            <ChartLegend
              items={legend.map((d) => ({
                label: d.label,
                color: d.color,
                value: formatVND(d.value),
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

export default DashboardPaymentMethods;

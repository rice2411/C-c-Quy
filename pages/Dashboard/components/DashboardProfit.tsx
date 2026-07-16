import React from 'react';
import { TrendingUp, Wallet, Percent, PieChart as PieIcon } from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { TrendChart, DonutChart, ChartLegend } from '@/components/ui/stats';
import { useRevenueReport } from '@/hooks/queries/useTransactionsQuery';
import { formatVND } from '@/utils/format/currencyUtil';

interface Props {
  fromISO: string;
  toISO: string;
  isDarkMode: boolean;
}

const COST_COLORS = ['#0ea5e9', '#f59e0b']; // nhập kho / hoa hồng

/** Lợi nhuận & biên (P&L): doanh thu, lợi nhuận, margin + biểu đồ 2 đường + donut cơ cấu chi phí. */
const DashboardProfit: React.FC<Props> = ({ fromISO, toISO, isDarkMode }) => {
  // queryKey theo {from,to}; lỗi → report=null (degrade êm như trước)
  const { report, loading } = useRevenueReport({ from: fromISO, to: toISO });

  const costData = report
    ? [
        { name: 'Nhập kho', value: report.costBreakdown.stockIn, color: COST_COLORS[0] },
        { name: 'Hoa hồng', value: report.costBreakdown.commission, color: COST_COLORS[1] },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <Card padding="none" layoutClassName="overflow-hidden">
      <Box layoutClassName="flex items-center gap-2 border-b px-5 py-4" borderClassName="border-slate-100 dark:border-slate-700">
        <TrendingUp className="h-5 w-5 text-emerald-500" />
        <Heading level={3} textClassName="text-lg font-semibold text-slate-800 dark:text-white">Lợi nhuận &amp; chi phí</Heading>
      </Box>

      {loading ? (
        <Box layoutClassName="flex items-center justify-center py-16"><Spinner size="lg" textClassName="text-primary-500" /></Box>
      ) : !report ? (
        <Box layoutClassName="px-5 py-10"><Typography as="p" size="sm" variant="muted">Không tải được báo cáo.</Typography></Box>
      ) : (
        <Box layoutClassName="space-y-5 p-5">
          {/* 3 chỉ số chính */}
          <Box layoutClassName="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Box layoutClassName="rounded-lg p-3" backgroundClassName="bg-slate-50 dark:bg-slate-900/40">
              <Box layoutClassName="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5 text-primary-500" /><Typography as="span" size="xs" variant="muted">Doanh thu</Typography></Box>
              <Typography as="p" layoutClassName="mt-1 text-xl font-bold" textClassName="text-slate-900 dark:text-white">{formatVND(report.totalRevenue)}</Typography>
            </Box>
            <Box layoutClassName="rounded-lg p-3" backgroundClassName="bg-slate-50 dark:bg-slate-900/40">
              <Box layoutClassName="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-emerald-500" /><Typography as="span" size="xs" variant="muted">Lợi nhuận</Typography></Box>
              <Typography as="p" layoutClassName="mt-1 text-xl font-bold" textClassName={report.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>{formatVND(report.profit)}</Typography>
            </Box>
            <Box layoutClassName="rounded-lg p-3" backgroundClassName="bg-slate-50 dark:bg-slate-900/40">
              <Box layoutClassName="flex items-center gap-1.5"><Percent className="h-3.5 w-3.5 text-violet-500" /><Typography as="span" size="xs" variant="muted">Biên lợi nhuận</Typography></Box>
              <Typography as="p" layoutClassName="mt-1 text-xl font-bold" textClassName="text-slate-900 dark:text-white">{(report.margin * 100).toFixed(1)}%</Typography>
            </Box>
          </Box>

          <Box layoutClassName="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Biểu đồ doanh thu + lợi nhuận */}
            <Box layoutClassName="lg:col-span-2">
              <Typography as="p" size="xs" variant="muted" layoutClassName="mb-2">Doanh thu vs Lợi nhuận theo thời gian</Typography>
              {report.series.length > 0 ? (
                <TrendChart
                  data={report.series}
                  xKey="label"
                  series={[
                    { key: 'revenue', label: 'Doanh thu', color: '#4abab9' },
                    { key: 'profit', label: 'Lợi nhuận', color: '#10b981' },
                  ]}
                  type="area"
                  isDarkMode={isDarkMode}
                  formatValue={formatVND}
                  heightClassName="h-56"
                />
              ) : (
                <Box layoutClassName="h-56 w-full">
                  <EmptyState icon={<TrendingUp className="h-6 w-6" />} title="Không có dữ liệu kỳ này" layoutClassName="!min-h-0" />
                </Box>
              )}
            </Box>

            {/* Donut cơ cấu chi phí */}
            <Box>
              <Box layoutClassName="mb-2 flex items-center gap-1.5"><PieIcon className="h-3.5 w-3.5 text-slate-400" /><Typography as="span" size="xs" variant="muted">Cơ cấu chi phí ({formatVND(report.totalCosts)})</Typography></Box>
              {costData.length > 0 ? (
                <DonutChart
                  data={costData.map((d) => ({ label: d.name, value: d.value, color: d.color }))}
                  formatValue={formatVND}
                  isDarkMode={isDarkMode}
                  innerRadius={40}
                  outerRadius={64}
                  containerClassName="h-44 w-full"
                />
              ) : (
                <Box layoutClassName="h-44 w-full">
                  <EmptyState icon={<Wallet className="h-6 w-6" />} title="Chưa có chi phí" layoutClassName="!min-h-0" />
                </Box>
              )}
              <Box layoutClassName="mt-1">
                <ChartLegend items={costData.map((d) => ({ label: d.name, color: d.color, value: formatVND(d.value) }))} />
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Card>
  );
};

export default DashboardProfit;

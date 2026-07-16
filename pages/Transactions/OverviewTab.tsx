import React, { useEffect, useMemo } from 'react';
import {
  Wallet, Coins, Boxes, TrendingUp, Banknote, PieChart as PieIcon, LineChart as LineIcon,
  BadgeDollarSign, TicketPercent, Building2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRevenueReport, useTransactions } from '@/hooks/queries/useTransactionsQuery';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatVND } from '@/utils/format/currencyUtil';
import { formatPercent } from '@/utils/format/numberUtil';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Spinner from '@/components/ui/Spinner';
import StatsBanner from '@/components/ui/StatsBanner';
import { TrendChart, DonutChart, ChartLegend } from '@/components/ui/stats';
import BankStatsCard from '@/pages/Transactions/components/BankStatsCard';

const OverviewTab: React.FC<{ fromDate: string; toDate: string }> = ({ fromDate, toDate }) => {
  const { t } = useLanguage();
  // BE tự fetch mọi nguồn & tính; báo cáo nạp lại khi đổi khoảng thời gian (queryKey theo from/to)
  const { report, loading, error } = useRevenueReport({ from: fromDate, to: toDate });
  const { transactions } = useTransactions();
  const periodTx = useMemo(() => {
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    if (to) to.setHours(23, 59, 59, 999);
    return transactions.filter((tr) => {
      const d = new Date(tr.transactionDate);
      return (!from || d >= from) && (!to || d <= to);
    });
  }, [transactions, fromDate, toDate]);

  useEffect(() => {
    if (error) toast.error('Không tải được dữ liệu doanh thu');
  }, [error]);

  if (loading || !report) {
    return <Box layoutClassName="flex flex-1 items-center justify-center py-16"><Spinner size="lg" textClassName="text-primary-500" /></Box>;
  }

  const profitPositive = report.profit >= 0;
  const pieData = [
    { name: 'Nhập kho', value: report.costBreakdown.stockIn, color: '#d97706' },
    { name: 'Hoa hồng', value: report.costBreakdown.commission, color: '#4abab9' },
    { name: 'Chi phí vận hành', value: report.costBreakdown.expenses, color: '#8b5cf6' },
    { name: 'Khấu hao', value: report.costBreakdown.depreciation, color: '#a3a3a3' },
  ].filter(d => d.value > 0);

  return (
    <Box layoutClassName="space-y-4">
      {/* Hero: Lợi nhuận */}
      <Card padding="lg" backgroundClassName="bg-gradient-to-br from-primary-50 via-white to-emerald-50/40 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900" borderClassName="border-slate-100 dark:border-slate-700">
        <Box layoutClassName="flex items-start justify-between gap-3">
          <Box layoutClassName="min-w-0">
            <Typography as="p" size="xs" variant="muted" layoutClassName="mb-1 font-medium uppercase tracking-wide">Lợi nhuận trong kỳ</Typography>
            <Typography as="p" layoutClassName="text-2xl font-bold sm:text-3xl" textClassName={profitPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
              {formatVND(report.profit)}
            </Typography>
            <Typography as="p" size="xs" variant="muted" layoutClassName="mt-1">
              Biên lợi nhuận {formatPercent(report.margin)} · {report.orderCount} đơn · Tổng thu {formatVND(report.totalRevenue)}
            </Typography>
          </Box>
          <Box layoutClassName="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
            <Wallet className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </Box>
        </Box>
        <Box layoutClassName="mt-3 rounded-lg bg-white/60 p-2.5 dark:bg-slate-900/30">
          <Typography as="p" size="xs" layoutClassName="font-mono" textClassName="text-slate-600 dark:text-slate-300">
            {formatVND(report.totalRevenue)} − {formatVND(report.totalStockIn)} (nhập kho) − {formatVND(report.totalCommission)} (hoa hồng) − {formatVND(report.totalExpenses)} (chi phí VH) − {formatVND(report.totalDepreciation)} (khấu hao) = {formatVND(report.profit)}
          </Typography>
        </Box>
      </Card>

      {/* P&L tổng hợp (1 banner — chi tiết kết toán xem ở tab Đối soát) */}
      <StatsBanner
        items={[
          { icon: Banknote, label: 'Tổng thu', value: formatVND(report.totalRevenue), accent: '#16a34a' },
          { icon: TicketPercent, label: 'Giảm giá (KM)', value: formatVND(report.totalDiscount), accent: '#e11d48' },
          { icon: BadgeDollarSign, label: 'Doanh thu thuần', value: formatVND(report.netRevenue), accent: '#0ea5e9' },
          { icon: Boxes, label: '− Nhập kho', value: formatVND(report.totalStockIn), accent: '#d97706' },
          { icon: Coins, label: '− Hoa hồng', value: formatVND(report.totalCommission), accent: '#4abab9' },
          { icon: Building2, label: '− Chi phí vận hành', value: formatVND(report.totalExpenses), accent: '#8b5cf6' },
          { icon: Boxes, label: '− Khấu hao', value: formatVND(report.totalDepreciation), accent: '#a3a3a3' },
          { icon: TrendingUp, label: '= Lợi nhuận', value: formatVND(report.profit), accent: profitPositive ? '#16a34a' : '#dc2626' },
        ]}
      />

      {/* Thống kê theo ngân hàng */}
      <BankStatsCard transactions={periodTx} />

      {/* Charts */}
      <Box layoutClassName="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Line: doanh thu vs lợi nhuận */}
        <Card padding="md" layoutClassName="lg:col-span-2" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
          <Box layoutClassName="mb-3 flex items-center gap-2">
            <LineIcon className="h-4 w-4 text-primary-500" />
            <Typography size="xs" variant="muted" layoutClassName="font-semibold uppercase tracking-wide">Doanh thu &amp; Lợi nhuận theo thời gian</Typography>
          </Box>
          <TrendChart
            data={report.series}
            xKey="label"
            series={[
              { key: 'revenue', label: 'Doanh thu', color: '#16a34a' },
              { key: 'profit', label: 'Lợi nhuận', color: '#4abab9' },
            ]}
            type="line"
            formatValue={formatVND}
            heightClassName="h-64"
          />
        </Card>

        {/* Pie: tỷ trọng chi phí */}
        <Card padding="md" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
          <Box layoutClassName="mb-3 flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-primary-500" />
            <Typography size="xs" variant="muted" layoutClassName="font-semibold uppercase tracking-wide">Tỷ trọng chi phí</Typography>
          </Box>
          {pieData.length === 0 ? (
            <Box layoutClassName="flex h-64 items-center justify-center">
              <Typography size="xs" variant="muted">Chưa có chi phí trong kỳ</Typography>
            </Box>
          ) : (
            <>
              <DonutChart
                data={pieData.map((d) => ({ label: d.name, value: d.value, color: d.color }))}
                formatValue={formatVND}
                innerRadius={45}
                outerRadius={80}
                containerClassName="h-64 w-full"
              />
              <Box layoutClassName="mt-2">
                <ChartLegend items={pieData.map((d) => ({ label: d.name, color: d.color, value: formatVND(d.value) }))} />
              </Box>
            </>
          )}
        </Card>
      </Box>

      {/* Đối chiếu ngân hàng */}
      <Card padding="md" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
        <Box layoutClassName="flex flex-wrap items-center justify-between gap-2">
          <Box layoutClassName="flex items-center gap-2">
            <Box layoutClassName="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Banknote className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </Box>
            <Box>
              <Typography as="p" size="xs" variant="muted" layoutClassName="uppercase tracking-wide font-medium">Tiền vào ngân hàng (đối chiếu)</Typography>
              <Typography as="p" size="sm" layoutClassName="font-bold" textClassName="text-slate-900 dark:text-white">{formatVND(report.bankIn)}</Typography>
            </Box>
          </Box>
          <Typography as="span" size="xs" layoutClassName="font-medium" textClassName={Math.abs(report.bankInDelta) < 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
            {report.bankInDelta === 0
              ? 'Khớp doanh thu đơn'
              : `Lệch ${formatVND(Math.abs(report.bankInDelta))} so với doanh thu đơn`}
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};

export default OverviewTab;

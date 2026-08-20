import React, { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Boxes, TrendingUp, Banknote, PieChart as PieIcon, LineChart as LineIcon,
  BadgeDollarSign, TicketPercent, Building2, Coins, ArrowLeftRight, Tags, AlertTriangle, RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRevenueReport, useTransactions, useLedgerSeries } from '@/hooks/queries/useTransactionsQuery';
import { fetchExpenseSummary } from '@/services/transactionService';
import { expenseCategoryLabel } from '@/types/transaction';
import { formatVND } from '@/utils/format/currencyUtil';
import { formatPercent } from '@/utils/format/numberUtil';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Spinner from '@/components/ui/Spinner';
import StatsBanner from '@/components/ui/StatsBanner';
import { TrendChart, DonutChart, ChartLegend, RankedBarList } from '@/components/ui/stats';
import BankStatsCard from '@/pages/Transactions/components/BankStatsCard';
import DashboardKpiCockpit from '@/pages/Dashboard/components/DashboardKpiCockpit';

const toLocalYMD = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Kỳ liền trước cùng độ dài (để KPI so sánh delta). */
const prevPeriod = (fromISO: string, toISO: string): { prevFrom: string; prevTo: string } => {
  const f = new Date(fromISO);
  const t = new Date(toISO);
  const days = Math.max(1, Math.round((t.getTime() - f.getTime()) / 86400000) + 1);
  const pf = new Date(f); pf.setDate(pf.getDate() - days);
  const pt = new Date(f); pt.setDate(pt.getDate() - 1);
  return { prevFrom: toLocalYMD(pf), prevTo: toLocalYMD(pt) };
};

const SectionTitle: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <Box layoutClassName="mb-3 flex items-center gap-2">
    {icon}
    <Typography size="xs" variant="muted" layoutClassName="font-semibold uppercase tracking-wide">{children}</Typography>
  </Box>
);

const OverviewTab: React.FC<{ fromDate: string; toDate: string }> = ({ fromDate, toDate }) => {
  const { report, loading, error } = useRevenueReport({ from: fromDate, to: toDate });
  const { transactions } = useTransactions();
  const { series: cashSeries } = useLedgerSeries(fromDate, toDate);
  const { prevFrom, prevTo } = useMemo(() => prevPeriod(fromDate, toDate), [fromDate, toDate]);

  // Chi phí vận hành theo danh mục (OPEX by category) — từ expense_summary.
  const { data: expenseSummary = [] } = useQuery({
    queryKey: ['expense-summary', fromDate, toDate],
    queryFn: () => fetchExpenseSummary(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  });

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
  const aov = report.orderCount > 0 ? report.netRevenue / report.orderCount : 0;
  const unclassified = report.unclassifiedOut ?? 0;

  // Line doanh thu / lợi nhuận / tổng chi phí theo thời gian (gộp 3 nhánh chi phí).
  const trendData = report.series.map((p) => ({
    ...p,
    cost: (p.stockIn ?? 0) + (p.opex ?? 0) + (p.depreciation ?? 0),
  }));

  // Donut 4 nhóm chi phí lớn.
  const pieData = [
    { name: 'Nhập kho', value: report.costBreakdown.stockIn, color: '#d97706' },
    { name: 'Hoa hồng', value: report.costBreakdown.commission, color: '#4abab9' },
    { name: 'Chi phí vận hành', value: report.costBreakdown.expenses, color: '#8b5cf6' },
    { name: 'Khấu hao', value: report.costBreakdown.depreciation, color: '#a3a3a3' },
  ].filter((d) => d.value > 0);

  // OPEX theo danh mục (top, giảm dần).
  const opexBars = [...expenseSummary]
    .filter((r) => r.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8)
    .map((r) => ({ key: r.category, label: expenseCategoryLabel(r.category), value: formatVND(r.amount), amount: r.amount }));

  return (
    <Box layoutClassName="space-y-4">
      {/* KPI điều hành có so kỳ trước */}
      <DashboardKpiCockpit
        fromISO={fromDate}
        toISO={toDate}
        prevFromISO={prevFrom}
        prevToISO={prevTo}
        compareText="vs kỳ trước"
      />

      {/* Cảnh báo: tiền ra chưa phân loại */}
      {unclassified > 0 ? (
        <Card padding="md" backgroundClassName="bg-amber-50 dark:bg-amber-900/15" borderClassName="border-amber-200 dark:border-amber-800">
          <Box layoutClassName="flex items-center gap-3">
            <Box layoutClassName="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" backgroundClassName="bg-amber-100 dark:bg-amber-900/40">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </Box>
            <Box layoutClassName="min-w-0">
              <Typography as="p" size="sm" layoutClassName="font-semibold" textClassName="text-amber-800 dark:text-amber-200">
                {formatVND(unclassified)} tiền ra chưa phân loại
              </Typography>
              <Typography as="p" size="xs" textClassName="text-amber-700 dark:text-amber-300/80">
                Vào tab Đối soát để phân loại — số này chưa được tính đúng vào chi phí.
              </Typography>
            </Box>
          </Box>
        </Card>
      ) : null}

      {/* P&L waterfall */}
      <StatsBanner
        items={[
          { icon: Banknote, label: 'Tổng thu', value: formatVND(report.totalRevenue), accent: '#16a34a' },
          { icon: RotateCcw, label: '− Hoàn tiền', value: formatVND(report.totalRefunded), accent: '#f43f5e' },
          { icon: TicketPercent, label: '− Giảm giá (KM)', value: formatVND(report.totalDiscount), accent: '#e11d48' },
          { icon: BadgeDollarSign, label: 'Doanh thu thuần', value: formatVND(report.netRevenue), sub: `AOV ${formatVND(aov)}`, accent: '#0ea5e9' },
          { icon: Boxes, label: '− Nhập kho', value: formatVND(report.totalStockIn), accent: '#d97706' },
          { icon: Coins, label: '− Hoa hồng', value: formatVND(report.totalCommission), accent: '#4abab9' },
          { icon: Building2, label: '− Chi phí VH', value: formatVND(report.totalExpenses), accent: '#8b5cf6' },
          { icon: TrendingUp, label: '= Lợi nhuận', value: formatVND(report.profit), sub: `Biên ${formatPercent(report.margin)}`, accent: profitPositive ? '#16a34a' : '#dc2626' },
        ]}
      />

      {/* Doanh thu · Lợi nhuận · Chi phí theo thời gian + tỷ trọng chi phí */}
      <Box layoutClassName="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card padding="md" layoutClassName="lg:col-span-2" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
          <SectionTitle icon={<LineIcon className="h-4 w-4 text-primary-500" />}>Doanh thu · Lợi nhuận · Chi phí theo thời gian</SectionTitle>
          <TrendChart
            data={trendData}
            xKey="label"
            series={[
              { key: 'revenue', label: 'Doanh thu', color: '#16a34a' },
              { key: 'profit', label: 'Lợi nhuận', color: '#4abab9' },
              { key: 'cost', label: 'Tổng chi phí', color: '#f97316' },
            ]}
            type="line"
            formatValue={formatVND}
            heightClassName="h-64"
          />
        </Card>

        <Card padding="md" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
          <SectionTitle icon={<PieIcon className="h-4 w-4 text-primary-500" />}>Tỷ trọng chi phí</SectionTitle>
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

      {/* Dòng tiền vào/ra theo ngày + Chi phí vận hành theo danh mục */}
      <Box layoutClassName="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card padding="md" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
          <SectionTitle icon={<ArrowLeftRight className="h-4 w-4 text-primary-500" />}>Dòng tiền vào / ra theo ngày</SectionTitle>
          {cashSeries.length === 0 ? (
            <Box layoutClassName="flex h-60 items-center justify-center">
              <Typography size="xs" variant="muted">Chưa có giao dịch trong kỳ</Typography>
            </Box>
          ) : (
            <TrendChart
              data={cashSeries}
              xKey="day"
              series={[
                { key: 'in', label: 'Tiền vào', color: '#16a34a' },
                { key: 'out', label: 'Tiền ra', color: '#ef4444' },
              ]}
              type="area"
              formatValue={formatVND}
              heightClassName="h-60"
            />
          )}
        </Card>

        <Card padding="md" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
          <SectionTitle icon={<Tags className="h-4 w-4 text-primary-500" />}>Chi phí vận hành theo danh mục</SectionTitle>
          {opexBars.length === 0 ? (
            <Box layoutClassName="flex h-60 items-center justify-center">
              <Typography size="xs" variant="muted">Chưa có chi phí vận hành đã phân loại</Typography>
            </Box>
          ) : (
            <RankedBarList items={opexBars} barColorClassName="bg-violet-500" />
          )}
        </Card>
      </Box>

      {/* Thống kê theo ngân hàng */}
      <BankStatsCard transactions={periodTx} />

      {/* Đối chiếu tiền vào ngân hàng vs doanh thu đơn */}
      <Card padding="md" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
        <Box layoutClassName="flex flex-wrap items-center justify-between gap-2">
          <Box layoutClassName="flex items-center gap-2">
            <Box layoutClassName="flex h-9 w-9 items-center justify-center rounded-lg" backgroundClassName="bg-blue-50 dark:bg-blue-900/20">
              <Banknote className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </Box>
            <Box>
              <Typography as="p" size="xs" variant="muted" layoutClassName="font-medium uppercase tracking-wide">Tiền vào ngân hàng (đối chiếu)</Typography>
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

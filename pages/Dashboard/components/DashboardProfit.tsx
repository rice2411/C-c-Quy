import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, Wallet, Percent, PieChart as PieIcon } from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import Spinner from '@/components/ui/Spinner';
import DonutTooltip from '@/pages/Dashboard/components/DonutTooltip';
import { fetchRevenueReport, RevenueReport } from '@/services/revenueService';
import { formatVND } from '@/utils/format/currencyUtil';

interface Props {
  fromISO: string;
  toISO: string;
  isDarkMode: boolean;
}

const COST_COLORS = ['#0ea5e9', '#f59e0b', '#a855f7']; // nhập kho / hoa hồng / chi phí khác

/** Lợi nhuận & biên (P&L): doanh thu, lợi nhuận, margin + biểu đồ 2 đường + donut cơ cấu chi phí. */
const DashboardProfit: React.FC<Props> = ({ fromISO, toISO, isDarkMode }) => {
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchRevenueReport(fromISO, toISO)
      .then((r) => { if (alive) setReport(r); })
      .catch(() => { if (alive) setReport(null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [fromISO, toISO]);

  const costData = report
    ? [
        { name: 'Nhập kho', value: report.costBreakdown.stockIn, color: COST_COLORS[0] },
        { name: 'Hoa hồng', value: report.costBreakdown.commission, color: COST_COLORS[1] },
        { name: 'Chi phí khác', value: report.costBreakdown.expenses, color: COST_COLORS[2] },
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
              <Box layoutClassName="h-56 w-full">
                {report.series.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={report.series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4abab9" stopOpacity={0.15} /><stop offset="95%" stopColor="#4abab9" stopOpacity={0} /></linearGradient>
                        <linearGradient id="cProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.18} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11 }} dy={8} minTickGap={24} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11 }} tickFormatter={(v) => new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(v)} />
                      <Tooltip
                        formatter={(value: number, name: string) => [formatVND(value), name === 'revenue' ? 'Doanh thu' : 'Lợi nhuận']}
                        contentStyle={{ backgroundColor: isDarkMode ? '#1e293b' : '#fff', borderRadius: 8, border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0', color: isDarkMode ? '#f8fafc' : '#0f172a' }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#4abab9" strokeWidth={2} fill="url(#cRev)" />
                      <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fill="url(#cProfit)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <Box layoutClassName="flex h-full items-center justify-center"><Typography size="sm" variant="muted">Không có dữ liệu kỳ này</Typography></Box>
                )}
              </Box>
            </Box>

            {/* Donut cơ cấu chi phí */}
            <Box>
              <Box layoutClassName="mb-2 flex items-center gap-1.5"><PieIcon className="h-3.5 w-3.5 text-slate-400" /><Typography as="span" size="xs" variant="muted">Cơ cấu chi phí ({formatVND(report.totalCosts)})</Typography></Box>
              <Box layoutClassName="h-44 w-full">
                {costData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={costData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={64} paddingAngle={2}>
                        {costData.map((d) => <Cell key={d.name} fill={d.color} />)}
                      </Pie>
                      <Tooltip content={<DonutTooltip isDarkMode={isDarkMode} formatValue={formatVND} />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box layoutClassName="flex h-full items-center justify-center"><Typography size="sm" variant="muted">Chưa có chi phí</Typography></Box>
                )}
              </Box>
              <Box layoutClassName="mt-1 space-y-0.5">
                {costData.map((d) => (
                  <Box key={d.name} layoutClassName="flex items-center justify-between">
                    <Box layoutClassName="flex items-center gap-1.5">
                      <Box layoutClassName="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <Typography as="span" size="xs" variant="muted">{d.name}</Typography>
                    </Box>
                    <Typography as="span" size="xs" textClassName="text-slate-700 dark:text-slate-300">{formatVND(d.value)}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Card>
  );
};

export default DashboardProfit;

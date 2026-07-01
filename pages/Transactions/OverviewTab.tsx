import React, { useEffect, useMemo, useState } from 'react';
import {
  Wallet, Coins, Boxes, TrendingUp, Banknote, PieChart as PieIcon, LineChart as LineIcon,
  ArrowUpRight, Undo2, BadgeDollarSign, Landmark, AlertTriangle, ChevronDown, ArrowDownLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';
import { useRevenueReport, useTransactions } from '@/hooks/queries/useTransactionsQuery';
import { useStockReceiptSummaries } from '@/hooks/queries/useStockReceiptQuery';
import { stockReceiptsInPeriod } from '@/services/revenueService';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatVND } from '@/utils/format/currencyUtil';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Spinner from '@/components/ui/Spinner';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '@/components/ui/Table';
import StatsBanner from '@/pages/StockReceipts/StatsBanner';
import RevenueTab from '@/pages/Transactions/RevenueTab';

const fmtDate = (s?: string | null) => {
  if (!s) return '—';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN');
};

// Khối danh sách gập/mở dùng chung cho Tiền vào / Nhập hàng / Tiền ra.
const ListSection: React.FC<{
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  total: string;
  accent: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ icon: Icon, label, total, accent, count, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card padding="none" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700" layoutClassName="overflow-hidden">
      <Box
        role="button"
        onClick={() => setOpen((o) => !o)}
        layoutClassName="flex w-full cursor-pointer items-center gap-2 px-4 py-3"
        hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700/40"
        stateClassName="transition-colors">
        <Box layoutClassName="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" backgroundClassName="bg-slate-50 dark:bg-slate-700/50">
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </Box>
        <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-slate-800 dark:text-slate-100">{label}</Typography>
        {typeof count === 'number' ? <Typography as="span" size="xs" variant="muted">({count})</Typography> : null}
        <Typography as="span" size="sm" layoutClassName="ml-auto font-bold" textClassName="text-slate-900 dark:text-white">{total}</Typography>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </Box>
      {open ? (
        <Box borderClassName="border-t border-slate-100 dark:border-slate-700">{children}</Box>
      ) : null}
    </Card>
  );
};

const pctText = (v: number) => `${(v * 100).toFixed(1)}%`;

const OverviewTab: React.FC<{ fromDate: string; toDate: string }> = ({ fromDate, toDate }) => {
  const { t } = useLanguage();
  // BE tự fetch mọi nguồn & tính; báo cáo nạp lại khi đổi khoảng thời gian (queryKey theo from/to)
  const { report, loading, error } = useRevenueReport({ from: fromDate, to: toDate });
  // Danh sách chi tiết cho 3 nhóm dòng tiền hiển thị ngay trong Tổng quan.
  const { receipts } = useStockReceiptSummaries();
  const { transactions } = useTransactions();

  const receiptsInPeriod = useMemo(
    () => stockReceiptsInPeriod(receipts, fromDate, toDate)
      .sort((a, b) => new Date(b.receiptDate ?? 0).getTime() - new Date(a.receiptDate ?? 0).getTime()),
    [receipts, fromDate, toDate],
  );
  const outTx = useMemo(() => {
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    if (to) to.setHours(23, 59, 59, 999);
    return transactions
      .filter((tr) => tr.transferType === 'out')
      .filter((tr) => {
        const d = new Date(tr.transactionDate);
        return (!from || d >= from) && (!to || d <= to);
      })
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  }, [transactions, fromDate, toDate]);
  const receiptsTotal = useMemo(() => receiptsInPeriod.reduce((s, r) => s + (r.totalAmount ?? 0), 0), [receiptsInPeriod]);
  const outTotal = useMemo(() => outTx.reduce((s, tr) => s + tr.transferAmount, 0), [outTx]);

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
              Biên lợi nhuận {pctText(report.margin)} · {report.orderCount} đơn · Tổng thu {formatVND(report.totalRevenue)}
            </Typography>
          </Box>
          <Box layoutClassName="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
            <Wallet className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </Box>
        </Box>
        <Box layoutClassName="mt-3 rounded-lg bg-white/60 p-2.5 dark:bg-slate-900/30">
          <Typography as="p" size="xs" layoutClassName="font-mono" textClassName="text-slate-600 dark:text-slate-300">
            {formatVND(report.totalRevenue)} − {formatVND(report.totalStockIn)} (nhập kho) − {formatVND(report.totalCommission)} (hoa hồng) = {formatVND(report.profit)}
          </Typography>
        </Box>
      </Card>

      {/* Breakdown */}
      <StatsBanner
        items={[
          { icon: Banknote, label: 'Tổng thu', value: formatVND(report.totalRevenue), accent: '#16a34a' },
          { icon: Boxes, label: '− Nhập kho', value: formatVND(report.totalStockIn), accent: '#d97706' },
          { icon: Coins, label: '− Hoa hồng', value: formatVND(report.totalCommission), accent: '#4abab9' },
          { icon: TrendingUp, label: '= Lợi nhuận', value: formatVND(report.profit), accent: profitPositive ? '#16a34a' : '#dc2626' },
        ]}
      />

      {/* Doanh thu thuần + đã hoàn + tiền ra phân loại (Tổng thu đã hiện ở banner trên) */}
      <StatsBanner
        items={[
          { icon: Undo2, label: t('transactions.totalRefunded'), value: formatVND(report.totalRefunded), accent: '#dc2626' },
          { icon: BadgeDollarSign, label: t('transactions.netRevenue'), value: formatVND(report.netRevenue), accent: '#0ea5e9' },
          // Tiền ra đã kết toán = chuyển về TK chính, KHÔNG trừ doanh thu (trung tính).
          { icon: Landmark, label: 'Đã kết toán', value: formatVND(report.settledOut ?? 0), accent: '#0284c7' },
          // Tiền ra chưa phân loại = cần xử lý (gắn hoàn tiền hoặc đánh dấu kết toán).
          { icon: AlertTriangle, label: 'Chưa phân loại', value: formatVND(report.unclassifiedOut ?? 0), accent: '#d97706' },
        ]}
      />

      {/* Charts */}
      <Box layoutClassName="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Line: doanh thu vs lợi nhuận */}
        <Card padding="md" layoutClassName="lg:col-span-2" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
          <Box layoutClassName="mb-3 flex items-center gap-2">
            <LineIcon className="h-4 w-4 text-primary-500" />
            <Typography size="xs" variant="muted" layoutClassName="font-semibold uppercase tracking-wide">Doanh thu &amp; Lợi nhuận theo thời gian</Typography>
          </Box>
          <Box layoutClassName="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.series} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
                <Tooltip formatter={(value: number | string, name) => [formatVND(Number(value)), name === 'revenue' ? 'Doanh thu' : 'Lợi nhuận']} labelStyle={{ fontSize: 12 }} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} dot={false} name="revenue" />
                <Line type="monotone" dataKey="profit" stroke="#4abab9" strokeWidth={2} dot={false} name="profit" />
              </LineChart>
            </ResponsiveContainer>
          </Box>
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
            <Box layoutClassName="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(value: number | string) => formatVND(Number(value))} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          )}
          {pieData.length > 0 && (
            <Box layoutClassName="mt-2 space-y-1">
              {pieData.map((d, i) => (
                <Box key={i} layoutClassName="flex items-center gap-2 text-xs">
                  <Box layoutClassName="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <Typography as="span" size="xs" variant="muted" layoutClassName="flex-1">{d.name}</Typography>
                  <Typography as="span" size="xs" layoutClassName="font-medium" textClassName="text-slate-700 dark:text-slate-200">{formatVND(d.value)}</Typography>
                </Box>
              ))}
            </Box>
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

      {/* Tiền vào — danh sách đơn doanh thu (gộp từ tab Doanh thu cũ) */}
      <ListSection icon={Banknote} label="Tiền vào — Đơn doanh thu" total={formatVND(report.totalRevenue)} accent="#16a34a" defaultOpen>
        <Box layoutClassName="p-3 sm:p-4">
          <RevenueTab fromDate={fromDate} toDate={toDate} />
        </Box>
      </ListSection>

      {/* Tiền nhập hàng — danh sách phiếu nhập trong kỳ */}
      <ListSection icon={Boxes} label="Tiền nhập hàng — Phiếu nhập" count={receiptsInPeriod.length} total={formatVND(receiptsTotal)} accent="#d97706">
        {receiptsInPeriod.length === 0 ? (
          <Box layoutClassName="px-4 py-8 text-center">
            <Typography size="sm" variant="muted">Không có phiếu nhập trong kỳ</Typography>
          </Box>
        ) : (
          <Box layoutClassName="overflow-x-auto">
            <Table>
              <TableHead backgroundClassName="bg-slate-50 dark:bg-slate-900/40">
                <TableRow>
                  <TableHeaderCell layoutClassName="px-4 py-2.5 text-left" textClassName="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Ngày</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-2.5 text-left" textClassName="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Nhà cung cấp</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-2.5 text-left" textClassName="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Hoá đơn</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-2.5 text-right" textClassName="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Tổng tiền</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {receiptsInPeriod.map((r) => (
                  <TableRow key={r.id} borderClassName="border-t border-slate-50 dark:border-slate-700/50">
                    <TableCell layoutClassName="px-4 py-2.5" textClassName="text-sm text-slate-500 dark:text-slate-400">{fmtDate(r.receiptDate)}</TableCell>
                    <TableCell layoutClassName="px-4 py-2.5" textClassName="text-sm text-slate-600 dark:text-slate-300">{r.supplierName || '—'}</TableCell>
                    <TableCell layoutClassName="px-4 py-2.5" textClassName="text-sm text-slate-500 dark:text-slate-400">{r.invoiceNumber || '—'}</TableCell>
                    <TableCell layoutClassName="px-4 py-2.5 text-right" textClassName="text-sm font-semibold text-amber-600 dark:text-amber-400">{formatVND(r.totalAmount ?? 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </ListSection>

      {/* Tiền ra — giao dịch chi trong kỳ */}
      <ListSection icon={ArrowDownLeft} label="Tiền ra — Giao dịch chi" count={outTx.length} total={formatVND(outTotal)} accent="#e11d48">
        {outTx.length === 0 ? (
          <Box layoutClassName="px-4 py-8 text-center">
            <Typography size="sm" variant="muted">Không có giao dịch chi trong kỳ</Typography>
          </Box>
        ) : (
          <Box layoutClassName="overflow-x-auto">
            <Table>
              <TableHead backgroundClassName="bg-slate-50 dark:bg-slate-900/40">
                <TableRow>
                  <TableHeaderCell layoutClassName="px-4 py-2.5 text-left" textClassName="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Ngày</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-2.5 text-left" textClassName="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Nội dung</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-2.5 text-left" textClassName="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Mã đơn</TableHeaderCell>
                  <TableHeaderCell layoutClassName="px-4 py-2.5 text-right" textClassName="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Số tiền</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {outTx.map((tr) => (
                  <TableRow key={tr.id} borderClassName="border-t border-slate-50 dark:border-slate-700/50">
                    <TableCell layoutClassName="px-4 py-2.5" textClassName="text-sm text-slate-500 dark:text-slate-400">{fmtDate(tr.transactionDate)}</TableCell>
                    <TableCell layoutClassName="px-4 py-2.5" textClassName="text-sm text-slate-600 dark:text-slate-300">{tr.content || tr.description || '—'}</TableCell>
                    <TableCell layoutClassName="px-4 py-2.5" textClassName="text-sm text-slate-500 dark:text-slate-400">{tr.orderNumber || '—'}</TableCell>
                    <TableCell layoutClassName="px-4 py-2.5 text-right" textClassName="text-sm font-semibold text-rose-600 dark:text-rose-400">{formatVND(tr.transferAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </ListSection>
    </Box>
  );
};

export default OverviewTab;

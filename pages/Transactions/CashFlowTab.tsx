import React, { useMemo, useState } from 'react';
import { Banknote, Boxes, Coins, TrendingUp, ChevronDown } from 'lucide-react';
import { useRevenueReport } from '@/hooks/queries/useTransactionsQuery';
import { useStockReceiptSummaries } from '@/hooks/queries/useStockReceiptQuery';
import { useOrders } from '@/hooks/useOrders';
import { revenueOrdersInPeriod, stockReceiptsInPeriod } from '@/services/revenueService';
import { formatVND } from '@/utils/format/currencyUtil';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '@/components/ui/Table';
import StatsBanner from '@/pages/StockReceipts/StatsBanner';
import RevenueTab from '@/pages/Transactions/RevenueTab';

const fmtDate = (s?: string | null) => {
  if (!s) return '—';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('vi-VN');
};

// Khối danh sách gập/mở dùng chung cho Doanh thu / Chi phí.
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

// Màn "Doanh thu & Chi phí": P&L nghiệp vụ — doanh thu (đơn) − chi phí (nhập hàng + hoa hồng).
const CashFlowTab: React.FC<{ fromDate: string; toDate: string }> = ({ fromDate, toDate }) => {
  const { report } = useRevenueReport({ from: fromDate, to: toDate });
  const { orders } = useOrders();
  const { receipts } = useStockReceiptSummaries();

  const inOrders = useMemo(
    () => revenueOrdersInPeriod(orders, fromDate, toDate)
      .sort((a, b) => new Date(b.deliveryDate ?? 0).getTime() - new Date(a.deliveryDate ?? 0).getTime()),
    [orders, fromDate, toDate],
  );
  const inTotal = useMemo(() => inOrders.reduce((s, o) => s + (o.total ?? 0), 0), [inOrders]);

  const receiptsInPeriod = useMemo(
    () => stockReceiptsInPeriod(receipts, fromDate, toDate)
      .sort((a, b) => new Date(b.receiptDate ?? 0).getTime() - new Date(a.receiptDate ?? 0).getTime()),
    [receipts, fromDate, toDate],
  );
  const receiptsTotal = useMemo(() => receiptsInPeriod.reduce((s, r) => s + (r.totalAmount ?? 0), 0), [receiptsInPeriod]);

  const commissionTotal = report?.totalCommission ?? 0;
  const profitPositive = (report?.profit ?? 0) >= 0;

  return (
    <Box layoutClassName="space-y-4">
      {/* P&L: doanh thu − chi phí (nhập hàng + hoa hồng) = lợi nhuận */}
      {report ? (
        <StatsBanner
          items={[
            { icon: Banknote, label: 'Doanh thu', value: formatVND(report.totalRevenue), accent: '#16a34a' },
            { icon: Boxes, label: '− Nhập hàng', value: formatVND(report.totalStockIn), accent: '#d97706' },
            { icon: Coins, label: '− Hoa hồng', value: formatVND(report.totalCommission), accent: '#4abab9' },
            { icon: TrendingUp, label: '= Lợi nhuận', value: formatVND(report.profit), accent: profitPositive ? '#16a34a' : '#dc2626' },
          ]}
        />
      ) : null}

      {/* Doanh thu — danh sách đơn */}
      <ListSection icon={Banknote} label="Doanh thu — Đơn hàng" count={inOrders.length} total={formatVND(inTotal)} accent="#16a34a" defaultOpen>
        <Box layoutClassName="p-3 sm:p-4">
          <RevenueTab fromDate={fromDate} toDate={toDate} />
        </Box>
      </ListSection>

      {/* Chi phí — nhập hàng */}
      <ListSection icon={Boxes} label="Chi phí — Nhập hàng" count={receiptsInPeriod.length} total={formatVND(receiptsTotal)} accent="#d97706">
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

      {/* Chi phí — hoa hồng (tổng; chi tiết theo CTV ở mục Hoa hồng) */}
      <ListSection icon={Coins} label="Chi phí — Hoa hồng" total={formatVND(commissionTotal)} accent="#4abab9">
        <Box layoutClassName="px-4 py-4">
          <Typography size="sm" variant="muted">
            Tổng hoa hồng cộng tác viên trong kỳ: <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-slate-800 dark:text-slate-100">{formatVND(commissionTotal)}</Typography>. Xem chi tiết theo CTV ở mục Hoa hồng.
          </Typography>
        </Box>
      </ListSection>
    </Box>
  );
};

export default CashFlowTab;

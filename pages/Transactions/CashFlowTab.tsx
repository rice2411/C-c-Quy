import React, { useMemo, useState } from 'react';
import { Banknote, Boxes, ArrowDownLeft, ChevronDown } from 'lucide-react';
import { useTransactions } from '@/hooks/queries/useTransactionsQuery';
import { useStockReceiptSummaries } from '@/hooks/queries/useStockReceiptQuery';
import { useOrders } from '@/hooks/useOrders';
import { revenueOrdersInPeriod, stockReceiptsInPeriod } from '@/services/revenueService';
import { formatVND } from '@/utils/format/currencyUtil';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '@/components/ui/Table';
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

// Màn "Dòng tiền": liệt kê chi tiết tiền vào / tiền nhập hàng / tiền ra trong kỳ.
const CashFlowTab: React.FC<{ fromDate: string; toDate: string }> = ({ fromDate, toDate }) => {
  const { orders } = useOrders();
  const { receipts } = useStockReceiptSummaries();
  const { transactions } = useTransactions();

  const inOrders = useMemo(
    () => revenueOrdersInPeriod(orders, fromDate, toDate),
    [orders, fromDate, toDate],
  );
  const inTotal = useMemo(() => inOrders.reduce((s, o) => s + (o.total ?? 0), 0), [inOrders]);

  const receiptsInPeriod = useMemo(
    () => stockReceiptsInPeriod(receipts, fromDate, toDate)
      .sort((a, b) => new Date(b.receiptDate ?? 0).getTime() - new Date(a.receiptDate ?? 0).getTime()),
    [receipts, fromDate, toDate],
  );
  const receiptsTotal = useMemo(() => receiptsInPeriod.reduce((s, r) => s + (r.totalAmount ?? 0), 0), [receiptsInPeriod]);

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
  const outTotal = useMemo(() => outTx.reduce((s, tr) => s + tr.transferAmount, 0), [outTx]);

  return (
    <Box layoutClassName="space-y-4">
      {/* Tiền vào — danh sách đơn doanh thu */}
      <ListSection icon={Banknote} label="Tiền vào — Đơn doanh thu" count={inOrders.length} total={formatVND(inTotal)} accent="#16a34a" defaultOpen>
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

export default CashFlowTab;

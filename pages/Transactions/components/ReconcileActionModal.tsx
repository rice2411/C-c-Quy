import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link2, Link2Off, Loader2, PackageOpen, ReceiptText, ShoppingBag } from 'lucide-react';
import { LedgerTransaction } from '@/types';
import { expenseCategoryLabel, LEDGER_STATUS_META } from '@/types/transaction';
import { formatVND } from '@/utils/format/currencyUtil';
import { useOrders } from '@/hooks/useOrders';
import { reconcileOrderTransaction } from '@/services/orderService';
import {
  linkTransactionExpense,
  linkTransactionOrder,
  unlinkTransactionExpense,
} from '@/services/transactionService';
import {
  fetchReceiptsForReconcile,
  reconcileReceipt,
  type ReconcileReceiptItem,
} from '@/services/stockReceiptService';
import { fetchManualExpenses } from '@/services/manualExpenseService';
import { ManualExpense } from '@/types';
import BaseModal from '@/components/BaseModal';
import Box from '@/components/ui/Box';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transaction: LedgerTransaction | null;
  /** Gọi sau khi đối soát/gỡ để refetch bảng. */
  onChanged: () => void;
}

const fmtDate = (v?: string | null): string => {
  if (!v) return '—';
  const d = new Date(String(v).replace(' ', 'T'));
  return Number.isNaN(d.getTime())
    ? String(v)
    : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const ReconcileActionModal: React.FC<Props> = ({ isOpen, onClose, transaction: tx, onChanged }) => {
  const { orders } = useOrders();
  const [receipts, setReceipts] = useState<ReconcileReceiptItem[]>([]);
  const [expenses, setExpenses] = useState<ManualExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const out = tx?.transferType === 'out';
  const amt = tx?.transferAmount ?? 0;
  const unmatched = tx?.status === 'unmatched';

  useEffect(() => {
    if (!isOpen || !tx || !out || !unmatched) return;
    setShowAll(false);
    setLoading(true);
    Promise.all([fetchReceiptsForReconcile(), fetchManualExpenses()])
      .then(([r, e]) => { setReceipts(r); setExpenses(e); })
      .catch(() => toast.error('Không tải được danh sách ứng viên.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tx?.id]);

  // ---- ứng viên ----
  const orderCands = useMemo(() => {
    if (!tx || out) return [];
    const unpaid = orders.filter((o) => o.paymentStatus !== 'PAID');
    const exact = unpaid.filter((o) => o.total === amt || o.depositAmount === amt);
    return (showAll ? unpaid : exact).slice(0, 40);
  }, [orders, tx, out, amt, showAll]);

  const receiptCands = useMemo(() => {
    if (!tx || !out) return [];
    const free = receipts.filter((r) => !r.reconciled);
    const exact = free.filter((r) => (r.totalAmount ?? 0) === amt);
    return (showAll ? free : exact).slice(0, 40);
  }, [receipts, tx, out, amt, showAll]);

  const expenseCands = useMemo(() => {
    if (!tx || !out) return [];
    const free = expenses.filter((e) => !e.transactionId);
    const exact = free.filter((e) => e.amount === amt);
    return (showAll ? free : exact).slice(0, 40);
  }, [expenses, tx, out, amt, showAll]);

  if (!tx) return null;

  const run = async (id: string, fn: () => Promise<unknown>, okMsg: string) => {
    setBusy(id);
    try {
      await fn();
      toast.success(okMsg);
      onChanged();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Thao tác thất bại.');
    } finally {
      setBusy(null);
    }
  };

  const statusMeta = LEDGER_STATUS_META[tx.status];

  const header = (
    <Box layoutClassName="flex items-center justify-between gap-3">
      <Box layoutClassName="min-w-0">
        <Typography as="p" size="lg" layoutClassName="font-bold" textClassName={out ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
          {out ? '−' : '+'}{formatVND(amt)}
        </Typography>
        <Typography as="p" size="xs" layoutClassName="truncate" textClassName="text-slate-500 dark:text-slate-400">
          {fmtDate(tx.transactionDate)} · {tx.gateway || 'GD'} · {tx.content || '—'}
        </Typography>
      </Box>
      <Badge size="sm" backgroundClassName="bg-slate-100 dark:bg-slate-700" textClassName="font-semibold text-slate-600 dark:text-slate-300">
        {statusMeta?.label ?? tx.status}
      </Badge>
    </Box>
  );

  // Dòng ứng viên chung
  const row = (
    key: string,
    left: React.ReactNode,
    sub: React.ReactNode,
    onPick: () => void,
    exact: boolean,
  ) => (
    <Box
      key={key}
      layoutClassName="flex items-center justify-between gap-2 rounded-lg border p-2.5"
      borderClassName={exact ? 'border-emerald-200 dark:border-emerald-800' : 'border-slate-100 dark:border-slate-700'}
      backgroundClassName="bg-white dark:bg-slate-800"
    >
      <Box layoutClassName="min-w-0 flex-1">
        <Box layoutClassName="flex items-center gap-2">
          {left}
          {exact ? (
            <Badge size="sm" backgroundClassName="bg-emerald-100 dark:bg-emerald-900/30" textClassName="text-emerald-700 dark:text-emerald-300">
              đúng tiền
            </Badge>
          ) : null}
        </Box>
        <Typography as="p" size="xs" layoutClassName="truncate" textClassName="text-slate-400 dark:text-slate-500">
          {sub}
        </Typography>
      </Box>
      <Button type="button" variant="primary" size="sm" disabled={busy !== null} leftIcon={<Link2 className="h-3.5 w-3.5" />} onClick={onPick}>
        Gắn
      </Button>
    </Box>
  );

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Đối soát giao dịch" size="lg">
      <Box layoutClassName="space-y-4">
        {header}

        {/* Đã đối soát → cho gỡ (đơn / chi phí) */}
        {!unmatched ? (
          <Box layoutClassName="space-y-3">
            <Box layoutClassName="rounded-lg border p-3" borderClassName="border-slate-200 dark:border-slate-700" backgroundClassName="bg-slate-50 dark:bg-slate-800/60">
              <Typography size="sm" textClassName="text-slate-600 dark:text-slate-300">
                Giao dịch này đã ở trạng thái <Typography as="span" layoutClassName="font-semibold" textClassName="text-slate-800 dark:text-slate-100">{statusMeta?.label ?? tx.status}</Typography>
                {tx.orderNumber ? <> · đơn <Typography as="span" layoutClassName="font-mono font-semibold" textClassName="text-primary-600 dark:text-primary-400">{tx.orderNumber}</Typography></> : null}.
              </Typography>
            </Box>
            {tx.status === 'matched' ? (
              <Button type="button" variant="secondary" fullWidth disabled={busy !== null} leftIcon={<Link2Off className="h-4 w-4" />}
                onClick={() => run('unlink', () => linkTransactionOrder(tx.id, ''), 'Đã gỡ khớp đơn.')}>
                Gỡ khớp đơn
              </Button>
            ) : tx.status === 'expense' ? (
              <Button type="button" variant="secondary" fullWidth disabled={busy !== null} leftIcon={<Link2Off className="h-4 w-4" />}
                onClick={() => run('unlink', () => unlinkTransactionExpense(tx.id), 'Đã gỡ khớp chi phí.')}>
                Gỡ khớp chi phí
              </Button>
            ) : (
              <Typography size="xs" variant="muted">Trạng thái này không cần đối soát tay ở đây.</Typography>
            )}
          </Box>
        ) : loading ? (
          <Box layoutClassName="flex items-center justify-center py-12"><Spinner size="lg" textClassName="text-primary-500" /></Box>
        ) : !out ? (
          // ---- TIỀN VÀO → đơn hàng ----
          <Box layoutClassName="space-y-2">
            <Box layoutClassName="flex items-center justify-between">
              <Typography size="xs" layoutClassName="flex items-center gap-1.5 font-semibold uppercase" textClassName="text-slate-500 dark:text-slate-400">
                <ShoppingBag className="h-3.5 w-3.5" /> Đơn hàng chưa thanh toán
              </Typography>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAll((s) => !s)}>
                {showAll ? 'Chỉ đúng số tiền' : 'Hiện tất cả'}
              </Button>
            </Box>
            <Box layoutClassName="max-h-[46vh] space-y-1.5 overflow-y-auto">
              {orderCands.length === 0 ? (
                <EmptyState title={showAll ? 'Không có đơn chưa thanh toán.' : 'Không có đơn trùng số tiền. Bấm "Hiện tất cả".'} />
              ) : (
                orderCands.map((o) =>
                  row(
                    o.id,
                    <Typography as="span" size="sm" layoutClassName="font-mono font-semibold" textClassName="text-primary-700 dark:text-primary-300">
                      {o.orderNumber || o.id}
                    </Typography>,
                    <>{formatVND(o.total)} · {o.paymentStatus}</>,
                    () => run(o.id, () => reconcileOrderTransaction(o.id, tx.id), `Đã khớp GD với đơn ${o.orderNumber || ''}.`),
                    o.total === amt || o.depositAmount === amt,
                  ),
                )
              )}
            </Box>
          </Box>
        ) : (
          // ---- TIỀN RA → phiếu nhập + chi phí ----
          <Box layoutClassName="space-y-4">
            <Box layoutClassName="flex justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAll((s) => !s)}>
                {showAll ? 'Chỉ đúng số tiền' : 'Hiện tất cả'}
              </Button>
            </Box>

            <Box layoutClassName="space-y-2">
              <Typography size="xs" layoutClassName="flex items-center gap-1.5 font-semibold uppercase" textClassName="text-slate-500 dark:text-slate-400">
                <PackageOpen className="h-3.5 w-3.5" /> Phiếu nhập ({receiptCands.length})
              </Typography>
              {receiptCands.length === 0 ? (
                <Typography size="xs" variant="muted">Không có phiếu nhập phù hợp.</Typography>
              ) : (
                receiptCands.map((r) =>
                  row(
                    `rc-${r.receiptId}`,
                    <Typography as="span" size="sm" layoutClassName="truncate font-semibold" textClassName="text-slate-800 dark:text-slate-100">
                      {r.supplierName || 'Phiếu nhập'} · {formatVND(r.totalAmount ?? 0)}
                    </Typography>,
                    <>{fmtDate(r.receiptDate)}{r.invoiceNumber ? ` · ${r.invoiceNumber}` : ''}</>,
                    () => run(`rc-${r.receiptId}`, () => reconcileReceipt(r.receiptId, tx.id), 'Đã gắn phiếu nhập.'),
                    (r.totalAmount ?? 0) === amt,
                  ),
                )
              )}
            </Box>

            <Box layoutClassName="space-y-2">
              <Typography size="xs" layoutClassName="flex items-center gap-1.5 font-semibold uppercase" textClassName="text-slate-500 dark:text-slate-400">
                <ReceiptText className="h-3.5 w-3.5" /> Chi phí ({expenseCands.length})
              </Typography>
              {expenseCands.length === 0 ? (
                <Typography size="xs" variant="muted">Không có khoản chi phí phù hợp.</Typography>
              ) : (
                expenseCands.map((e) =>
                  row(
                    `ex-${e.id}`,
                    <Typography as="span" size="sm" layoutClassName="truncate font-semibold" textClassName="text-slate-800 dark:text-slate-100">
                      {expenseCategoryLabel(e.category)} · {formatVND(e.amount)}
                    </Typography>,
                    <>{fmtDate(e.date)}{e.note ? ` · ${e.note}` : ''}</>,
                    () => run(`ex-${e.id}`, async () => {
                      const { ok } = await linkTransactionExpense(tx.id, e.id);
                      if (!ok) throw new Error('Không gắn được (khoản chi đã gắn GD khác?).');
                    }, 'Đã gắn chi phí.'),
                    e.amount === amt,
                  ),
                )
              )}
            </Box>
          </Box>
        )}
      </Box>
    </BaseModal>
  );
};

export default ReconcileActionModal;

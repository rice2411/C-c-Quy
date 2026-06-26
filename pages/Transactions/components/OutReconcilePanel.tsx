import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Link2,
  RotateCcw,
  Undo2,
  Banknote,
} from 'lucide-react';
import { Transaction } from '@/types/transaction';
import { RefundListItem } from '@/services/orderService';
import { formatVND } from '@/utils/format/currencyUtil';
import { formatDateTime } from '@/utils/format/dateUtil';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';

const InlineSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <Box layoutClassName={`h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent ${className ?? 'border-slate-300'}`} />
);

interface OutReconcilePanelProps {
  transactions: Transaction[];      // giao dịch tiền RA (transferType='out')
  refunds: RefundListItem[];        // toàn bộ phiếu hoàn
  onReconcileRefund: (orderId: string, refundId: string, transactionId: string) => Promise<void>;
  onUnreconcileRefund: (orderId: string, refundId: string) => Promise<void>;
  onMarkSettled: (transactionId: string) => Promise<void>;     // đánh dấu "đã kết toán"
  onUnmarkSettled: (transactionId: string) => Promise<void>;
  formatDate: (dateStr: string) => string;
}

interface OutRowProps {
  transaction: Transaction;
  linkedRefund?: RefundListItem;
  pendingRefunds: RefundListItem[];
  onReconcileRefund: (orderId: string, refundId: string) => Promise<void>;
  onUnreconcileRefund: (orderId: string, refundId: string) => Promise<void>;
  onMarkSettled: () => Promise<void>;
  onUnmarkSettled: () => Promise<void>;
  formatDate: (dateStr: string) => string;
}

const OutRow: React.FC<OutRowProps> = ({
  transaction: tr, linkedRefund, pendingRefunds,
  onReconcileRefund, onUnreconcileRefund, onMarkSettled, onUnmarkSettled, formatDate,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refundSug = useMemo(() => {
    const exact = pendingRefunds.filter(r => r.amount === tr.transferAmount);
    const others = pendingRefunds.filter(r => r.amount !== tr.transferAmount);
    return [...exact, ...others];
  }, [pendingRefunds, tr.transferAmount]);

  const handleBusy = async (id: string, fn: () => Promise<void>) => {
    setBusyId(id);
    try { await fn(); } finally { setBusyId(null); }
  };

  const isSettled = !!tr.settledOut;
  const isLinked = !!linkedRefund || isSettled;

  const statusBadge = () => {
    if (linkedRefund) {
      return (
        <Box layoutClassName="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 dark:bg-emerald-900/20">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <Typography as="span" size="xs" layoutClassName="font-semibold" textClassName="text-emerald-600 dark:text-emerald-300">
            Hoàn tiền · {linkedRefund.orderNumber || '—'}
          </Typography>
        </Box>
      );
    }
    if (isSettled) {
      return (
        <Box layoutClassName="flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 dark:bg-sky-900/20">
          <Banknote className="h-3.5 w-3.5 text-sky-500" />
          <Typography as="span" size="xs" layoutClassName="font-semibold" textClassName="text-sky-600 dark:text-sky-300">
            Đã kết toán
          </Typography>
        </Box>
      );
    }
    return (
      <Badge size="sm" layoutClassName="gap-1 px-2 py-0.5 text-[10px]"
        borderClassName="border-amber-200 dark:border-amber-700"
        backgroundClassName="bg-amber-50 dark:bg-amber-900/20"
        textClassName="text-amber-700 dark:text-amber-300">
        Chưa khớp
      </Badge>
    );
  };

  const handleUnlink = async () => {
    if (linkedRefund) await handleBusy(linkedRefund.refundId, () => onUnreconcileRefund(linkedRefund.orderId, linkedRefund.refundId));
    else if (isSettled) await handleBusy('settled', () => onUnmarkSettled());
  };

  return (
    <Box layoutClassName="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <Box layoutClassName="flex items-start gap-2 p-3.5">
        <Button
          type="button"
          onClick={() => setExpanded(v => !v)}
          variant="ghost"
          disableVariantHover
          disableVariantTextColor
          borderClassName="border-transparent"
          layoutClassName="flex min-w-0 flex-1 items-start gap-3 text-left">
          <Box layoutClassName="flex shrink-0 items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 dark:bg-rose-900/20">
            <ArrowDownLeft className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
            <Typography as="span" layoutClassName="text-sm font-bold" textClassName="text-rose-700 dark:text-rose-300">
              −{formatVND(tr.transferAmount)}
            </Typography>
          </Box>

          <Box layoutClassName="min-w-0 flex-1">
            <Typography as="div" size="xs" textClassName="text-slate-500 dark:text-slate-400">
              {formatDate(tr.transactionDate)}
            </Typography>
            {tr.content && (
              <Typography as="div" size="xs" layoutClassName="mt-0.5 max-w-sm truncate" textClassName="text-slate-600 dark:text-slate-300">
                {tr.content}
              </Typography>
            )}
          </Box>

          <Box layoutClassName="flex shrink-0 items-center gap-2">
            {statusBadge()}
            {expanded
              ? <ChevronDown className="h-4 w-4 text-slate-400" />
              : <ChevronRight className="h-4 w-4 text-slate-400" />}
          </Box>
        </Button>

        {isLinked && (
          <Button
            type="button"
            disabled={!!busyId}
            onClick={handleUnlink}
            title="Gỡ"
            variant="ghost"
            disableVariantHover
            disableVariantTextColor
            layoutClassName="flex shrink-0 items-center gap-1.5"
            roundedClassName="rounded-lg"
            borderClassName="border border-slate-200 hover:border-red-200 dark:border-slate-600 dark:hover:border-red-700"
            backgroundClassName="bg-slate-50 hover:bg-red-50 dark:bg-slate-700 dark:hover:bg-red-900/20"
            sizeClassName="px-2.5 py-1.5 text-xs"
            textClassName="font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
            stateClassName="transition-colors disabled:opacity-50">
            {busyId ? <InlineSpinner /> : <RotateCcw className="h-3.5 w-3.5" />}
            Gỡ
          </Button>
        )}
      </Box>

      {expanded && !isLinked && (
        <Box layoutClassName="border-t border-slate-100 dark:border-slate-700">
          {/* Hành động 1 chạm: đánh dấu đã kết toán */}
          <Box layoutClassName="flex items-center justify-between gap-3 px-4 py-3">
            <Box layoutClassName="flex min-w-0 items-center gap-2">
              <Banknote className="h-4 w-4 shrink-0 text-sky-500" />
              <Typography size="xs" variant="muted">Tiền đã chuyển về tài khoản chính (không phải hoàn tiền).</Typography>
            </Box>
            <Button
              type="button"
              disabled={!!busyId}
              onClick={() => handleBusy('settled', () => onMarkSettled())}
              variant="ghost"
              disableVariantHover
              disableVariantTextColor
              layoutClassName="flex shrink-0 items-center gap-1.5"
              roundedClassName="rounded-lg"
              borderClassName="border border-sky-300 dark:border-sky-600"
              backgroundClassName="bg-sky-50 hover:bg-sky-100 dark:bg-sky-900/20 dark:hover:bg-sky-900/40"
              sizeClassName="px-3 py-1.5 text-xs"
              textClassName="font-semibold text-sky-700 dark:text-sky-300"
              stateClassName="transition-colors disabled:cursor-not-allowed disabled:opacity-50">
              {busyId === 'settled' ? <InlineSpinner className="border-sky-400" /> : <Banknote className="h-3.5 w-3.5" />}
              Đánh dấu đã kết toán
            </Button>
          </Box>

          {/* Hoặc khớp với 1 phiếu hoàn */}
          <Box layoutClassName="border-t border-slate-100 px-4 pt-2 dark:border-slate-700">
            <Typography as="p" size="xs" variant="muted" layoutClassName="font-semibold uppercase tracking-wide">
              Hoặc khớp với phiếu hoàn
            </Typography>
          </Box>
          {refundSug.length === 0 ? (
            <Box layoutClassName="flex items-center gap-2 px-4 py-3" textClassName="text-slate-400 dark:text-slate-500">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <Typography size="xs" variant="muted">Không còn phiếu hoàn nào chưa đối soát.</Typography>
            </Box>
          ) : (
            <Box layoutClassName="divide-y divide-slate-100 dark:divide-slate-700">
              {refundSug.map(r => {
                const isExact = r.amount === tr.transferAmount;
                return (
                  <Box key={r.refundId} layoutClassName="flex items-center justify-between gap-4 px-4 py-3">
                    <Box layoutClassName="flex min-w-0 flex-1 items-start gap-3">
                      <Box layoutClassName={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${isExact ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <Box layoutClassName="min-w-0 space-y-0.5">
                        <Box layoutClassName="flex flex-wrap items-center gap-1.5">
                          {r.orderNumber && (
                            <Badge size="sm" layoutClassName="px-2 py-0.5 text-[10px] font-semibold font-mono"
                              borderClassName="border-primary-200 dark:border-primary-700"
                              backgroundClassName="bg-primary-50 dark:bg-primary-900/20"
                              textClassName="text-primary-700 dark:text-primary-300">
                              {r.orderNumber}
                            </Badge>
                          )}
                          <Typography as="span" size="xs" layoutClassName="font-semibold" textClassName="text-slate-700 dark:text-slate-200">
                            {formatVND(r.amount)}
                          </Typography>
                          {!isExact && (
                            <Typography as="span" size="xs" textClassName="text-amber-600 dark:text-amber-400">(lệch)</Typography>
                          )}
                        </Box>
                        <Typography as="div" size="xs" layoutClassName="max-w-sm truncate" textClassName="text-slate-500 dark:text-slate-400">
                          {formatDateTime(r.createdAt)}{r.reason ? ` · ${r.reason}` : ''}
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      type="button"
                      disabled={!!busyId}
                      onClick={() => handleBusy(r.refundId, () => onReconcileRefund(r.orderId, r.refundId))}
                      variant="ghost"
                      disableVariantHover
                      disableVariantTextColor
                      layoutClassName="flex items-center gap-1.5"
                      roundedClassName="rounded-lg"
                      borderClassName="border border-emerald-300 dark:border-emerald-600"
                      backgroundClassName="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40"
                      sizeClassName="px-3 py-1.5 text-xs"
                      textClassName="font-semibold text-emerald-700 dark:text-emerald-300"
                      stateClassName="transition-colors disabled:cursor-not-allowed disabled:opacity-50">
                      {busyId === r.refundId ? <InlineSpinner className="border-emerald-400" /> : <Link2 className="h-3.5 w-3.5" />}
                      Khớp
                    </Button>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

const OutReconcilePanel: React.FC<OutReconcilePanelProps> = ({
  transactions, refunds,
  onReconcileRefund, onUnreconcileRefund, onMarkSettled, onUnmarkSettled, formatDate,
}) => {
  const pendingRefunds = useMemo(
    () => refunds.filter(r => !r.reconciled && !r.transactionId),
    [refunds],
  );
  const refundByTxId = useMemo(() => {
    const m = new Map<string, RefundListItem>();
    refunds.forEach(r => { if (r.transactionId) m.set(r.transactionId, r); });
    return m;
  }, [refunds]);

  if (transactions.length === 0) {
    return (
      <Box layoutClassName="flex flex-1 flex-col items-center justify-center gap-3 py-16" textClassName="text-slate-400 dark:text-slate-500">
        <Box layoutClassName="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <ArrowDownLeft className="h-8 w-8 opacity-40" />
        </Box>
        <Typography size="sm" variant="muted">Không có giao dịch tiền ra trong kỳ</Typography>
      </Box>
    );
  }

  const renderRow = (tr: Transaction) => (
    <OutRow
      key={tr.id}
      transaction={tr}
      linkedRefund={refundByTxId.get(tr.id)}
      pendingRefunds={pendingRefunds}
      onReconcileRefund={onReconcileRefund}
      onUnreconcileRefund={onUnreconcileRefund}
      onMarkSettled={() => onMarkSettled(tr.id)}
      onUnmarkSettled={() => onUnmarkSettled(tr.id)}
      formatDate={formatDate}
    />
  );

  const isMatched = (tr: Transaction) => refundByTxId.has(tr.id) || !!tr.settledOut;
  const unmatched = transactions.filter(tr => !isMatched(tr));
  const matched = transactions.filter(isMatched);

  return (
    <Box layoutClassName="space-y-5">
      {unmatched.length > 0 && (
        <Box layoutClassName="space-y-2">
          <Typography as="p" size="xs" variant="muted" layoutClassName="font-semibold uppercase tracking-wide">
            Chưa khớp ({unmatched.length})
          </Typography>
          {unmatched.map(renderRow)}
        </Box>
      )}
      {matched.length > 0 && (
        <Box layoutClassName="space-y-2">
          <Typography as="p" size="xs" variant="muted" layoutClassName="font-semibold uppercase tracking-wide">
            Đã xử lý ({matched.length})
          </Typography>
          {matched.map(renderRow)}
        </Box>
      )}
    </Box>
  );
};

export default OutReconcilePanel;

import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Link2,
  RotateCcw,
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
  transactions: Transaction[];        // giao dịch tiền RA (transferType='out')
  refunds: RefundListItem[];          // toàn bộ phiếu hoàn (mọi đơn)
  // Gắn 1 phiếu hoàn ↔ 1 GD tiền ra. Gỡ khi truyền refund đang gắn chính tx này.
  onReconcile: (orderId: string, refundId: string, transactionId: string) => Promise<void>;
  onUnreconcile: (orderId: string, refundId: string) => Promise<void>;
  formatDate: (dateStr: string) => string;
}

interface OutRowProps {
  transaction: Transaction;
  linkedRefund?: RefundListItem;        // phiếu hoàn đang gắn GD này (nếu có)
  pendingRefunds: RefundListItem[];     // phiếu hoàn chưa đối soát (để chọn)
  onReconcile: (orderId: string, refundId: string) => Promise<void>;
  onUnreconcile: (orderId: string, refundId: string) => Promise<void>;
  formatDate: (dateStr: string) => string;
}

const OutRow: React.FC<OutRowProps> = ({
  transaction: tr, linkedRefund, pendingRefunds, onReconcile, onUnreconcile, formatDate,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Gợi ý: phiếu hoàn cùng số tiền lên đầu.
  const suggestions = useMemo(() => {
    const exact = pendingRefunds.filter(r => r.amount === tr.transferAmount);
    const others = pendingRefunds.filter(r => r.amount !== tr.transferAmount);
    return [...exact, ...others];
  }, [pendingRefunds, tr.transferAmount]);

  const exactCount = useMemo(
    () => pendingRefunds.filter(r => r.amount === tr.transferAmount).length,
    [pendingRefunds, tr.transferAmount],
  );

  const handleLink = async (orderId: string, refundId: string) => {
    setBusyId(refundId);
    try { await onReconcile(orderId, refundId); } finally { setBusyId(null); }
  };

  const handleUnlink = async () => {
    if (!linkedRefund) return;
    setBusyId(linkedRefund.refundId);
    try { await onUnreconcile(linkedRefund.orderId, linkedRefund.refundId); } finally { setBusyId(null); }
  };

  const isLinked = !!linkedRefund;

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
            {isLinked ? (
              <Box layoutClassName="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 dark:bg-emerald-900/20">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <Typography as="span" size="xs" layoutClassName="font-semibold font-mono" textClassName="text-emerald-600 dark:text-emerald-300">
                  {linkedRefund?.orderNumber || 'Đã khớp'}
                </Typography>
              </Box>
            ) : exactCount > 0 ? (
              <Badge size="sm" layoutClassName="gap-1 px-2 py-0.5 text-[10px] font-semibold"
                borderClassName="border-amber-200 dark:border-amber-700"
                backgroundClassName="bg-amber-50 dark:bg-amber-900/20"
                textClassName="text-amber-700 dark:text-amber-300">
                {exactCount} gợi ý
              </Badge>
            ) : (
              <Badge size="sm" layoutClassName="gap-1 px-2 py-0.5 text-[10px]"
                borderClassName="border-slate-200 dark:border-slate-600"
                backgroundClassName="bg-slate-50 dark:bg-slate-700/50"
                textClassName="text-slate-500 dark:text-slate-400">
                Chưa khớp
              </Badge>
            )}
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
            title="Gỡ đối soát phiếu hoàn"
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
          {suggestions.length === 0 ? (
            <Box layoutClassName="flex items-center gap-2 px-4 py-3" textClassName="text-slate-400 dark:text-slate-500">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <Typography size="xs" variant="muted">
                Không còn phiếu hoàn nào chưa đối soát để gắn.
              </Typography>
            </Box>
          ) : (
            <Box layoutClassName="divide-y divide-slate-100 dark:divide-slate-700">
              {suggestions.map(r => {
                const isExact = r.amount === tr.transferAmount;
                const isBusy = busyId === r.refundId;
                return (
                  <Box key={r.refundId} layoutClassName="flex items-center justify-between gap-4 px-4 py-3">
                    <Box layoutClassName="flex min-w-0 flex-1 items-start gap-3">
                      <Box
                        layoutClassName={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${isExact ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        title={isExact ? 'Khớp số tiền' : 'Khác số tiền'}
                      />
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
                            <Typography as="span" size="xs" textClassName="text-amber-600 dark:text-amber-400">
                              (lệch số tiền)
                            </Typography>
                          )}
                        </Box>
                        <Typography as="div" size="xs" layoutClassName="max-w-sm truncate" textClassName="text-slate-500 dark:text-slate-400">
                          {formatDateTime(r.createdAt)}{r.reason ? ` · ${r.reason}` : ''}
                        </Typography>
                      </Box>
                    </Box>

                    <Box>
                      <Button
                        type="button"
                        disabled={!!busyId}
                        onClick={() => handleLink(r.orderId, r.refundId)}
                        variant="ghost"
                        disableVariantHover
                        disableVariantTextColor
                        layoutClassName="flex items-center gap-1.5"
                        roundedClassName="rounded-lg"
                        borderClassName="border border-primary-300 dark:border-primary-600"
                        backgroundClassName="bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/40"
                        sizeClassName="px-3 py-1.5 text-xs"
                        textClassName="font-semibold text-primary-700 dark:text-primary-300"
                        stateClassName="transition-colors disabled:cursor-not-allowed disabled:opacity-50">
                        {isBusy ? <InlineSpinner className="border-primary-400" /> : <Link2 className="h-3.5 w-3.5" />}
                        Khớp
                      </Button>
                    </Box>
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
  transactions, refunds, onReconcile, onUnreconcile, formatDate,
}) => {
  // Phiếu hoàn chưa đối soát (chưa gắn GD, chưa đánh dấu tiền mặt) — để chọn gắn.
  const pendingRefunds = useMemo(
    () => refunds.filter(r => !r.reconciled && !r.transactionId),
    [refunds],
  );
  // map nhanh transactionId -> phiếu hoàn đang gắn.
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

  const matched = transactions.filter(tr => refundByTxId.has(tr.id));
  const unmatched = transactions.filter(tr => !refundByTxId.has(tr.id));

  return (
    <Box layoutClassName="space-y-5">
      {unmatched.length > 0 && (
        <Box layoutClassName="space-y-2">
          <Typography as="p" size="xs" variant="muted" layoutClassName="font-semibold uppercase tracking-wide">
            Chưa khớp phiếu hoàn ({unmatched.length})
          </Typography>
          {unmatched.map(tr => (
            <OutRow
              key={tr.id}
              transaction={tr}
              pendingRefunds={pendingRefunds}
              onReconcile={onReconcile}
              onUnreconcile={onUnreconcile}
              formatDate={formatDate}
            />
          ))}
        </Box>
      )}

      {matched.length > 0 && (
        <Box layoutClassName="space-y-2">
          <Typography as="p" size="xs" variant="muted" layoutClassName="font-semibold uppercase tracking-wide">
            Đã khớp phiếu hoàn ({matched.length})
          </Typography>
          {matched.map(tr => (
            <OutRow
              key={tr.id}
              transaction={tr}
              linkedRefund={refundByTxId.get(tr.id)}
              pendingRefunds={pendingRefunds}
              onReconcile={onReconcile}
              onUnreconcile={onUnreconcile}
              formatDate={formatDate}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default OutReconcilePanel;

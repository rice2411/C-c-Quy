import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  TrendingUp,
  User,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { Order } from '@/types/order';
import { Transaction } from '@/types/transaction';
import { PaymentStatus } from '@/types/enums';
import { formatVND } from '@/utils/format/currencyUtil';
import { formatTimeDiff, getOrderSuggestions, OrderSuggestion } from '@/utils/transactions/matchOrders';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';

const InlineSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <Box layoutClassName={`h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent ${className ?? 'border-slate-300'}`} />
);

interface TransactionMappingPanelProps {
  transactions: Transaction[];
  orders: Order[];
  onLink: (orderId: string, transaction: Transaction) => Promise<void>;
  onMarkExternal: (transaction: Transaction) => Promise<void>;
  onUnmarkExternal: (transaction: Transaction) => Promise<void>;
  formatDate: (dateStr: string) => string;
}

interface MappingRowProps {
  transaction: Transaction;
  suggestions: OrderSuggestion[];
  onLink: (orderId: string) => Promise<void>;
  onMarkExternal: () => Promise<void>;
  formatDate: (dateStr: string) => string;
}

const MappingRow: React.FC<MappingRowProps> = ({
  transaction, suggestions, onLink, onMarkExternal, formatDate,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [linked, setLinked] = useState<string | null>(null);
  const [markingExternal, setMarkingExternal] = useState(false);

  const handleLink = async (orderId: string) => {
    setLinkingId(orderId);
    try {
      await onLink(orderId);
      setLinked(orderId);
    } finally {
      setLinkingId(null);
    }
  };

  const handleMarkExternal = async () => {
    setMarkingExternal(true);
    try { await onMarkExternal(); } finally { setMarkingExternal(false); }
  };

  const hasSuggestions = suggestions.length > 0;
  const isDone = !!linked;

  return (
    <Box layoutClassName="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      {/* Header row */}
      <Box layoutClassName="flex items-start gap-2 p-3.5">
        <Button
          type="button"
          onClick={() => setExpanded(v => !v)}
          variant="ghost"
          disableVariantHover
          disableVariantTextColor
          borderClassName="border-transparent"
          layoutClassName="flex min-w-0 flex-1 items-start gap-3 text-left">
          <Box layoutClassName="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 dark:bg-emerald-900/20">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <Typography as="span" layoutClassName="text-sm font-bold" textClassName="text-emerald-700 dark:text-emerald-300">
              +{formatVND(transaction.transferAmount)}
            </Typography>
          </Box>

          <Box layoutClassName="min-w-0 flex-1">
            <Typography as="div" size="xs" textClassName="text-slate-500 dark:text-slate-400">
              {formatDate(transaction.transactionDate)}
            </Typography>
            {transaction.content && (
              <Typography as="div" size="xs" layoutClassName="mt-0.5 max-w-sm truncate" textClassName="text-slate-600 dark:text-slate-300">
                {transaction.content}
              </Typography>
            )}
          </Box>

          <Box layoutClassName="flex shrink-0 items-center gap-2">
            {isDone ? (
              <Box layoutClassName="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 dark:bg-emerald-900/20">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <Typography as="span" size="xs" layoutClassName="font-semibold" textClassName="text-emerald-600 dark:text-emerald-300">Đã liên kết</Typography>
              </Box>
            ) : hasSuggestions ? (
              <Badge size="sm" layoutClassName="gap-1 px-2 py-0.5 text-[10px] font-semibold"
                borderClassName="border-amber-200 dark:border-amber-700"
                backgroundClassName="bg-amber-50 dark:bg-amber-900/20"
                textClassName="text-amber-700 dark:text-amber-300">
                {suggestions.length} gợi ý
              </Badge>
            ) : (
              <Badge size="sm" layoutClassName="gap-1 px-2 py-0.5 text-[10px]"
                borderClassName="border-slate-200 dark:border-slate-600"
                backgroundClassName="bg-slate-50 dark:bg-slate-700/50"
                textClassName="text-slate-500 dark:text-slate-400">
                Không có gợi ý
              </Badge>
            )}
            {expanded
              ? <ChevronDown className="h-4 w-4 text-slate-400" />
              : <ChevronRight className="h-4 w-4 text-slate-400" />}
          </Box>
        </Button>

        {/* Mark external button — luôn hiện khi chưa liên kết */}
        {!isDone && (
          <Button
            type="button"
            disabled={markingExternal}
            onClick={handleMarkExternal}
            title="Đánh dấu không liên quan đến hệ thống"
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
            {markingExternal ? <InlineSpinner /> : <XCircle className="h-3.5 w-3.5" />}
            Ngoài hệ thống
          </Button>
        )}
      </Box>

      {/* Suggestions */}
      {expanded && !isDone && (
        <Box layoutClassName="border-t border-slate-100 dark:border-slate-700">
          {!hasSuggestions ? (
            <Box layoutClassName="flex items-center gap-2 px-4 py-3" textClassName="text-slate-400 dark:text-slate-500">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <Typography size="xs" variant="muted">
                Không tìm thấy đơn CK nào khớp{' '}
                <Typography as="span" layoutClassName="font-bold" textClassName="text-slate-600 dark:text-slate-300">{formatVND(transaction.transferAmount)}</Typography>{' '}
                trong 7 ngày.
              </Typography>
            </Box>
          ) : (
            <Box layoutClassName="divide-y divide-slate-100 dark:divide-slate-700">
              {suggestions.map(({ order, minutesAfterOrder, score }) => {
                const isLinked = linked === order.id;
                const isLinking = linkingId === order.id;
                const alreadyPaid = order.paymentStatus === PaymentStatus.PAID;

                return (
                  <Box key={order.id} layoutClassName="flex items-center justify-between gap-4 px-4 py-3">
                    <Box layoutClassName="flex min-w-0 flex-1 items-start gap-3">
                      <Box
                        layoutClassName={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                          score > 1400 ? 'bg-emerald-500' : score > 800 ? 'bg-amber-400' : 'bg-slate-300'
                        }`}
                        title={`Độ khớp: ${score}`}
                      />
                      <Box layoutClassName="min-w-0 space-y-0.5">
                        <Box layoutClassName="flex flex-wrap items-center gap-1.5">
                          {order.orderNumber && (
                            <Badge size="sm" layoutClassName="px-2 py-0.5 text-[10px] font-semibold font-mono"
                              borderClassName="border-primary-200 dark:border-primary-700"
                              backgroundClassName="bg-primary-50 dark:bg-primary-900/20"
                              textClassName="text-primary-700 dark:text-primary-300">
                              {order.orderNumber}
                            </Badge>
                          )}
                          {alreadyPaid && (
                            <Badge size="sm" layoutClassName="px-2 py-0.5 text-[10px]"
                              borderClassName="border-emerald-200 dark:border-emerald-700"
                              backgroundClassName="bg-emerald-50 dark:bg-emerald-900/20"
                              textClassName="text-emerald-700 dark:text-emerald-300">
                              Đã thanh toán
                            </Badge>
                          )}
                        </Box>
                        <Box layoutClassName="flex flex-wrap items-center gap-3">
                          <Box layoutClassName="flex items-center gap-1">
                            <User className="h-3 w-3 text-slate-400" />
                            <Typography as="span" size="xs" textClassName="text-slate-600 dark:text-slate-300">
                              {order.customer?.name || '—'}
                            </Typography>
                          </Box>
                          <Box layoutClassName="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <Typography as="span" size="xs" textClassName="text-slate-500 dark:text-slate-400">
                              {formatTimeDiff(minutesAfterOrder)}
                            </Typography>
                          </Box>
                          {order.customer?.phone && (
                            <Typography as="span" size="xs" layoutClassName="font-mono" textClassName="text-slate-400 dark:text-slate-500">
                              {order.customer.phone}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>

                    <Box layoutClassName="hidden shrink-0 items-center gap-1.5 sm:flex">
                      <Typography as="span" size="xs" layoutClassName="font-semibold" textClassName="text-slate-700 dark:text-slate-200">
                        {formatVND(order.total)}
                      </Typography>
                      <ArrowRight className="h-3 w-3 text-slate-300" />
                      <Building2 className="h-3 w-3 text-slate-400" />
                    </Box>

                    <Box>
                      {isLinked ? (
                        <Box layoutClassName="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 dark:bg-emerald-900/20">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <Typography as="span" size="xs" layoutClassName="font-medium" textClassName="text-emerald-700 dark:text-emerald-300">Đã liên kết</Typography>
                        </Box>
                      ) : (
                        <Button
                          type="button"
                          disabled={isLinking || !!linked}
                          onClick={() => handleLink(order.id)}
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
                          {isLinking ? <InlineSpinner className="border-primary-400" /> : <ArrowRight className="h-3.5 w-3.5" />}
                          Liên kết
                        </Button>
                      )}
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

/* ─────────────────────────────────────────────────────────── */

interface ExternalRowProps {
  transaction: Transaction;
  onUnmark: () => Promise<void>;
  formatDate: (dateStr: string) => string;
}

const ExternalRow: React.FC<ExternalRowProps> = ({ transaction, onUnmark, formatDate }) => {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try { await onUnmark(); } finally { setLoading(false); }
  };

  return (
    <Box layoutClassName="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
      <Box layoutClassName="flex min-w-0 flex-1 items-center gap-3">
        <XCircle className="h-4 w-4 shrink-0 text-slate-400" />
        <Box layoutClassName="min-w-0">
          <Typography as="div" layoutClassName="text-sm font-semibold" textClassName="text-slate-600 dark:text-slate-300">
            +{formatVND(transaction.transferAmount)}
          </Typography>
          <Typography as="div" size="xs" variant="muted">
            {formatDate(transaction.transactionDate)}{transaction.content ? ` · ${transaction.content}` : ''}
          </Typography>
        </Box>
      </Box>
      <Button
        type="button"
        disabled={loading}
        onClick={handle}
        variant="ghost"
        disableVariantHover
        disableVariantTextColor
        layoutClassName="flex shrink-0 items-center gap-1.5"
        roundedClassName="rounded-lg"
        borderClassName="border border-slate-200 hover:border-primary-300 dark:border-slate-600 dark:hover:border-primary-600"
        backgroundClassName="bg-white dark:bg-slate-700"
        sizeClassName="px-2.5 py-1.5 text-xs"
        textClassName="font-medium text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
        stateClassName="transition-colors disabled:opacity-50">
        {loading ? <InlineSpinner /> : <RotateCcw className="h-3.5 w-3.5" />}
        Khôi phục
      </Button>
    </Box>
  );
};

/* ─────────────────────────────────────────────────────────── */

const TransactionMappingPanel: React.FC<TransactionMappingPanelProps> = ({
  transactions,
  orders,
  onLink,
  onMarkExternal,
  onUnmarkExternal,
  formatDate,
}) => {
  const [showExternal, setShowExternal] = useState(false);

  const pending = transactions.filter(tr => !tr.isExternal);
  const external = transactions.filter(tr => tr.isExternal);

  const rows = useMemo(
    () => pending.map(tr => ({ transaction: tr, suggestions: getOrderSuggestions(tr, orders) })),
    [pending, orders],
  );

  const withSuggestions = rows.filter(r => r.suggestions.length > 0);
  const withoutSuggestions = rows.filter(r => r.suggestions.length === 0);

  return (
    <Box layoutClassName="space-y-5">
      {/* Legend */}
      <Box layoutClassName="flex flex-wrap items-center gap-4 text-xs" textClassName="text-slate-500 dark:text-slate-400">
        <Box layoutClassName="flex items-center gap-1.5">
          <Box layoutClassName="h-2 w-2 rounded-full bg-emerald-500" />Khớp tốt (chưa TT + gần giờ)
        </Box>
        <Box layoutClassName="flex items-center gap-1.5">
          <Box layoutClassName="h-2 w-2 rounded-full bg-amber-400" />Khớp trung bình
        </Box>
        <Box layoutClassName="flex items-center gap-1.5">
          <Box layoutClassName="h-2 w-2 rounded-full bg-slate-300" />Khớp yếu
        </Box>
      </Box>

      {/* Pending transactions */}
      {pending.length === 0 ? (
        <Box layoutClassName="flex flex-col items-center justify-center gap-3 py-12" textClassName="text-slate-400 dark:text-slate-500">
          <Box layoutClassName="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20">
            <CheckCircle2 className="h-7 w-7 text-emerald-500 opacity-80" />
          </Box>
          <Typography size="sm" variant="muted">Tất cả đã được xử lý</Typography>
        </Box>
      ) : (
        <>
          {withSuggestions.length > 0 && (
            <Box layoutClassName="space-y-2">
              <Typography as="p" size="xs" variant="muted" layoutClassName="font-semibold uppercase tracking-wide">
                Có gợi ý khớp ({withSuggestions.length})
              </Typography>
              {withSuggestions.map(({ transaction, suggestions }) => (
                <MappingRow
                  key={transaction.id}
                  transaction={transaction}
                  suggestions={suggestions}
                  onLink={(orderId) => onLink(orderId, transaction)}
                  onMarkExternal={() => onMarkExternal(transaction)}
                  formatDate={formatDate}
                />
              ))}
            </Box>
          )}
          {withoutSuggestions.length > 0 && (
            <Box layoutClassName="space-y-2">
              <Typography as="p" size="xs" variant="muted" layoutClassName="font-semibold uppercase tracking-wide">
                Không tìm được đơn khớp ({withoutSuggestions.length})
              </Typography>
              {withoutSuggestions.map(({ transaction, suggestions }) => (
                <MappingRow
                  key={transaction.id}
                  transaction={transaction}
                  suggestions={suggestions}
                  onLink={(orderId) => onLink(orderId, transaction)}
                  onMarkExternal={() => onMarkExternal(transaction)}
                  formatDate={formatDate}
                />
              ))}
            </Box>
          )}
        </>
      )}

      {/* External transactions collapsible */}
      {external.length > 0 && (
        <Box layoutClassName="space-y-2">
          <Button
            type="button"
            onClick={() => setShowExternal(v => !v)}
            variant="ghost"
            disableVariantHover
            disableVariantTextColor
            borderClassName="border-transparent"
            layoutClassName="flex w-full items-center justify-between text-left"
            roundedClassName="rounded-lg"
            sizeClassName="px-1 py-1"
            backgroundClassName="hover:bg-slate-50 dark:hover:bg-slate-700/30"
            stateClassName="transition-colors">
            <Box layoutClassName="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-slate-400" />
              <Typography as="span" size="xs" variant="muted" layoutClassName="font-semibold uppercase tracking-wide">
                Ngoài hệ thống ({external.length})
              </Typography>
            </Box>
            {showExternal
              ? <ChevronDown className="h-4 w-4 text-slate-400" />
              : <ChevronRight className="h-4 w-4 text-slate-400" />}
          </Button>

          {showExternal && (
            <Box layoutClassName="space-y-1.5">
              {external.map(tr => (
                <ExternalRow
                  key={tr.id}
                  transaction={tr}
                  onUnmark={() => onUnmarkExternal(tr)}
                  formatDate={formatDate}
                />
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default TransactionMappingPanel;

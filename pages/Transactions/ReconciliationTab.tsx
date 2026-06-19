import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowRightLeft,
  RefreshCw,
  Banknote,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  BarChart2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrders } from '@/hooks/useOrders';
import { fetchTransactions, markTransactionExternal, linkTransactionOrder } from '@/services/transactionService';
import { PaymentStatus } from '@/types/enums';
import { Transaction } from '@/types';
import { formatVND } from '@/utils/format/currencyUtil';
import TransactionsDesktopTable from './components/desktop/TransactionsDesktopTable';
import TransactionsMobileList from './components/mobile/TransactionsMobileList';
import TransactionDetailModal from './components/TransactionDetailModal';
import TransactionMappingPanel from './components/TransactionMappingPanel';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import IconButton from '@/components/ui/IconButton';
import Spinner from '@/components/ui/Spinner';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import FilterToolbar from '@/components/shared/FilterToolbar';

type TabKey = 'all' | 'valid' | 'invalid' | 'external';

const InlineSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <Box layoutClassName={`h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent ${className ?? 'border-slate-300'}`} />
);

interface ExternalTransactionRowProps {
  transaction: Transaction;
  onUnmark: (tr: Transaction) => Promise<void>;
  formatDate: (dateStr: string) => string;
}

const ExternalTransactionRow: React.FC<ExternalTransactionRowProps> = ({ transaction: tr, onUnmark, formatDate }) => {
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    setBusy(true);
    try { await onUnmark(tr); } finally { setBusy(false); }
  };
  return (
    <Box layoutClassName="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <Box layoutClassName="flex min-w-0 flex-1 items-center gap-3">
        <Box layoutClassName="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
          <XCircle className="h-4 w-4 text-slate-400" />
        </Box>
        <Box layoutClassName="min-w-0">
          <Typography as="p" size="sm" layoutClassName="font-semibold" textClassName="text-slate-700 dark:text-slate-200">
            +{formatVND(tr.transferAmount)}
          </Typography>
          <Typography as="p" size="xs" layoutClassName="truncate" textClassName="text-slate-400 dark:text-slate-500">
            {formatDate(tr.transactionDate)}{tr.content ? ` · ${tr.content}` : ''}
          </Typography>
        </Box>
      </Box>
      <Button
        type="button"
        disabled={busy}
        onClick={handle}
        variant="ghost"
        disableVariantHover
        disableVariantTextColor
        layoutClassName="flex shrink-0 items-center gap-1.5"
        roundedClassName="rounded-lg"
        borderClassName="border border-slate-200 hover:border-primary-300 dark:border-slate-600 dark:hover:border-primary-600"
        backgroundClassName="bg-slate-50 hover:bg-primary-50 dark:bg-slate-700"
        sizeClassName="px-3 py-1.5 text-xs"
        textClassName="font-medium text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400"
        stateClassName="transition-colors disabled:opacity-50">
        {busy ? <InlineSpinner /> : <RotateCcw className="h-3.5 w-3.5" />}
        Khôi phục
      </Button>
    </Box>
  );
};

/* ─── Mini bar chart ─── */
const RevenueChart: React.FC<{ transactions: Transaction[]; fromDate: string; toDate: string }> = ({
  transactions, fromDate, toDate,
}) => {
  const bars = useMemo(() => {
    const end = toDate ? new Date(toDate) : new Date();
    end.setHours(23, 59, 59, 999);
    const start = fromDate ? new Date(fromDate) : (() => { const d = new Date(end); d.setDate(d.getDate() - 29); return d; })();
    const diffDays = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
    const bucketDays = diffDays <= 31 ? 1 : diffDays <= 90 ? 7 : 30;
    const map: Record<string, number> = {};
    transactions.forEach(tr => {
      const d = new Date(tr.transactionDate);
      if (d < start || d > end) return;
      const offset = Math.floor((d.getTime() - start.getTime()) / (bucketDays * 86_400_000));
      map[String(offset)] = (map[String(offset)] || 0) + tr.transferAmount;
    });
    const count = Math.ceil(diffDays / bucketDays);
    return Array.from({ length: count }, (_, i) => {
      const bucketStart = new Date(start.getTime() + i * bucketDays * 86_400_000);
      return { label: `${bucketStart.getDate()}/${bucketStart.getMonth() + 1}`, amount: map[String(i)] || 0 };
    });
  }, [transactions, fromDate, toDate]);

  const max = useMemo(() => Math.max(...bars.map(b => b.amount), 1), [bars]);
  if (!bars.some(b => b.amount > 0)) return null;

  return (
    <Card padding="none" layoutClassName="p-4 overflow-hidden" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
      <Box layoutClassName="mb-3 flex items-center gap-2">
        <BarChart2 className="h-4 w-4 text-primary-500" />
        <Typography size="xs" variant="muted" layoutClassName="font-semibold uppercase tracking-wide">Biểu đồ tiền vào</Typography>
      </Box>
      <Box layoutClassName="flex items-end gap-0.5 overflow-x-auto pb-1" style={{ height: 72 }}>
        {bars.map((b, i) => {
          const heightPct = b.amount > 0 ? Math.max(8, Math.round((b.amount / max) * 100)) : 0;
          return (
            <Box key={i} layoutClassName="group relative flex min-w-0 flex-1 flex-col items-center justify-end">
              {b.amount > 0 && (
                <Box layoutClassName="absolute bottom-5 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-1 whitespace-nowrap rounded bg-slate-800 px-2 py-0.5 text-[10px] text-white shadow group-hover:flex dark:bg-slate-600">
                  {formatVND(b.amount)}
                </Box>
              )}
              <Box
                layoutClassName={`w-full rounded-t transition-all ${b.amount > 0 ? 'bg-primary-400 hover:bg-primary-500 dark:bg-primary-500 dark:hover:bg-primary-400' : 'bg-slate-100 dark:bg-slate-700'}`}
                style={{ height: `${heightPct}%` }}
              />
              {bars.length <= 31 && (
                <Typography as="span" layoutClassName="mt-1 w-full truncate text-center text-[9px]" textClassName="text-slate-400 dark:text-slate-500">
                  {b.label}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    </Card>
  );
};

/* ─── Tab nội dung ─── */
const ReconciliationTab: React.FC<{ fromDate: string; toDate: string }> = ({ fromDate, toDate }) => {
  const { t } = useLanguage();
  const { orders, modifyOrder } = useOrders();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const loadData = async () => {
    try {
      setLoading(true);
      setTransactions(await fetchTransactions());
    } catch {
      toast.error(t('transactions.loadError') || 'Không tải được giao dịch');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      setTransactions(await fetchTransactions());
      toast.success(t('transactions.refreshSuccess') || 'Đã làm mới');
    } catch {
      toast.error(t('transactions.refreshError') || 'Làm mới thất bại');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const baseFiltered = useMemo(() => {
    let filtered = transactions.filter(tr => tr.transferType === 'in');
    if (fromDate) {
      const from = new Date(fromDate);
      filtered = filtered.filter(tr => new Date(tr.transactionDate) >= from);
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(tr => new Date(tr.transactionDate) <= to);
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(tr =>
        (tr.content && tr.content.toLowerCase().includes(q)) ||
        (tr.orderNumber && tr.orderNumber.toLowerCase().includes(q)) ||
        (tr.description && tr.description.toLowerCase().includes(q)) ||
        (tr.accountNumber && tr.accountNumber.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [transactions, searchTerm, fromDate, toDate]);

  const validTransactions = useMemo(() => baseFiltered.filter(tr => tr.orderNumber && tr.orderNumber.trim() !== ''), [baseFiltered]);
  const invalidTransactions = useMemo(() => baseFiltered.filter(tr => !tr.orderNumber || tr.orderNumber.trim() === ''), [baseFiltered]);
  const pendingInvalidCount = useMemo(() => invalidTransactions.filter(tr => !tr.isExternal).length, [invalidTransactions]);
  const externalTransactions = useMemo(() => baseFiltered.filter(tr => tr.isExternal), [baseFiltered]);

  const displayedTransactions =
    activeTab === 'valid' ? validTransactions :
    activeTab === 'invalid' ? invalidTransactions :
    activeTab === 'external' ? externalTransactions :
    baseFiltered;

  const totalAmount = useMemo(() => validTransactions.reduce((s, tr) => s + tr.transferAmount, 0), [validTransactions]);
  const avgAmount = useMemo(() => validTransactions.length > 0 ? Math.round(totalAmount / validTransactions.length) : 0, [totalAmount, validTransactions.length]);

  const handleTransactionClick = (tr: Transaction) => { setSelectedTransaction(tr); setIsDetailModalOpen(true); };

  const handleLinkOrder = async (orderId: string, transaction: Transaction) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const linkedNumber = order.orderNumber || orderId;
    try {
      await modifyOrder(orderId, {
        ...order,
        sepayId: transaction.sepayId,
        paymentStatus: order.paymentStatus === PaymentStatus.PAID ? order.paymentStatus : PaymentStatus.PAID,
      });
      // Ghi orderNumber xuống transaction để F5 vẫn giữ trạng thái đã khớp
      await linkTransactionOrder(transaction.id, linkedNumber);
      setTransactions(prev => prev.map(tr => tr.id === transaction.id ? { ...tr, orderNumber: linkedNumber } : tr));
      toast.success(`Đã liên kết GD #${transaction.sepayId} → ${order.orderNumber}`);
    } catch (err: any) {
      toast.error(err?.message || 'Không liên kết được');
      throw err;
    }
  };

  const handleMarkExternal = async (transaction: Transaction) => {
    try {
      await markTransactionExternal(transaction.id, true);
      setTransactions(prev => prev.map(tr => tr.id === transaction.id ? { ...tr, isExternal: true } : tr));
      toast.success('Đã chuyển sang "Ngoài hệ thống"');
    } catch (err: any) {
      toast.error(err?.message || 'Không thể đánh dấu');
      throw err;
    }
  };

  const handleUnmarkExternal = async (transaction: Transaction) => {
    try {
      await markTransactionExternal(transaction.id, false);
      setTransactions(prev => prev.map(tr => tr.id === transaction.id ? { ...tr, isExternal: false } : tr));
      toast.success('Đã khôi phục giao dịch');
    } catch (err: any) {
      toast.error(err?.message || 'Không thể khôi phục');
      throw err;
    }
  };

  const subTabs: { key: TabKey; label: string; count: number; icon: React.ReactNode }[] = [
    { key: 'all', label: 'Tất cả', count: baseFiltered.length, icon: <ArrowRightLeft className="h-3.5 w-3.5" /> },
    { key: 'valid', label: 'Hợp lệ', count: validTransactions.length, icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    { key: 'invalid', label: 'Chưa khớp', count: pendingInvalidCount, icon: <AlertTriangle className="h-3.5 w-3.5" /> },
    { key: 'external', label: 'Ngoài HT', count: externalTransactions.length, icon: <XCircle className="h-3.5 w-3.5" /> },
  ];

  if (loading) {
    return <Box layoutClassName="flex flex-1 items-center justify-center py-16"><Spinner size="lg" textClassName="text-primary-500" /></Box>;
  }

  return (
    <Box layoutClassName="space-y-4">
      {/* Stats */}
      <Box layoutClassName="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card padding="none" layoutClassName="p-4" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
          <Box layoutClassName="flex items-start justify-between">
            <Box>
              <Typography as="p" size="xs" variant="muted" layoutClassName="mb-1 uppercase tracking-wide font-medium">Tiền vào (đã khớp)</Typography>
              <Typography as="p" layoutClassName="text-lg font-bold sm:text-xl" textClassName="text-emerald-600 dark:text-emerald-400">{formatVND(totalAmount)}</Typography>
            </Box>
            <Box layoutClassName="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <Banknote className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </Box>
          </Box>
        </Card>
        <Card padding="none" layoutClassName="p-4" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
          <Box layoutClassName="flex items-start justify-between">
            <Box>
              <Typography as="p" size="xs" variant="muted" layoutClassName="mb-1 uppercase tracking-wide font-medium">Trung bình / GD</Typography>
              <Typography as="p" layoutClassName="text-lg font-bold sm:text-xl" textClassName="text-primary-600 dark:text-primary-400">{avgAmount > 0 ? formatVND(avgAmount) : '—'}</Typography>
            </Box>
          </Box>
        </Card>
        <Card padding="none" layoutClassName="p-4" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
          <Box layoutClassName="flex items-start justify-between">
            <Box>
              <Typography as="p" size="xs" variant="muted" layoutClassName="mb-1 uppercase tracking-wide font-medium">Hợp lệ</Typography>
              <Box layoutClassName="flex items-baseline gap-1.5">
                <Typography as="p" layoutClassName="text-lg font-bold sm:text-xl" textClassName="text-slate-900 dark:text-white">{validTransactions.length}</Typography>
                {baseFiltered.length > 0 && (
                  <Typography as="span" size="xs" variant="muted">({Math.round(validTransactions.length / baseFiltered.length * 100)}%)</Typography>
                )}
              </Box>
            </Box>
            <Box layoutClassName="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </Box>
          </Box>
        </Card>
        <Card padding="none" layoutClassName="p-4" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
          <Box layoutClassName="flex items-start justify-between">
            <Box>
              <Typography as="p" size="xs" variant="muted" layoutClassName="mb-1 uppercase tracking-wide font-medium">Chưa khớp</Typography>
              <Typography as="p" layoutClassName="text-lg font-bold sm:text-xl" textClassName={pendingInvalidCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}>{pendingInvalidCount}</Typography>
            </Box>
            <Box layoutClassName={`flex h-9 w-9 items-center justify-center rounded-lg ${pendingInvalidCount > 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
              <AlertTriangle className={`h-4 w-4 ${pendingInvalidCount > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400'}`} />
            </Box>
          </Box>
        </Card>
      </Box>

      {/* Search + refresh */}
      <Box layoutClassName="flex items-center gap-2">
        <Box layoutClassName="min-w-0 flex-1">
          <FilterToolbar
            search={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder={t('transactions.searchPlaceholder') || 'Tìm nội dung, mã đơn...'}
          />
        </Box>
        <IconButton
          type="button"
          label="Làm mới"
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="secondary"
          layoutClassName="rounded-xl p-2.5"
          backgroundClassName="bg-white dark:bg-slate-800"
          borderClassName="border border-slate-200 dark:border-slate-700"
          textClassName="text-slate-600 dark:text-slate-400"
          hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700"
          stateClassName="transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </IconButton>
      </Box>

      {/* Chart */}
      {(activeTab === 'all' || activeTab === 'valid') && (
        <RevenueChart transactions={activeTab === 'valid' ? validTransactions : baseFiltered} fromDate={fromDate} toDate={toDate} />
      )}

      {/* Sub-tabs */}
      <Box layoutClassName="flex gap-1 rounded-xl border border-slate-100 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/60">
        {subTabs.map(({ key, label, count, icon }) => {
          const active = activeTab === key;
          return (
            <Button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              variant="ghost"
              disableVariantHover
              disableVariantTextColor
              borderClassName="border-transparent"
              layoutClassName="flex flex-1 items-center justify-center gap-1.5"
              roundedClassName="rounded-lg"
              sizeClassName="px-3 py-2 text-xs"
              stateClassName="transition-all"
              backgroundClassName={active ? 'bg-white shadow-sm dark:bg-slate-700' : 'bg-transparent'}
              textClassName={active ? 'font-semibold text-slate-900 dark:text-white' : (key === 'invalid' && count > 0 ? 'font-semibold text-amber-600 dark:text-amber-400' : 'font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200')}>
              <Box layoutClassName={active ? 'text-primary-500' : ''}>{icon}</Box>
              <Typography as="span">{label}</Typography>
              <Badge
                size="sm"
                borderClassName="border-transparent"
                backgroundClassName={active ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-slate-200 dark:bg-slate-600'}
                textClassName={active ? 'text-[10px] font-bold text-primary-700 dark:text-primary-300' : 'text-[10px] font-bold text-slate-600 dark:text-slate-300'}>
                {count}
              </Badge>
            </Button>
          );
        })}
      </Box>

      {/* Content */}
      {activeTab === 'external' ? (
        externalTransactions.length === 0 ? (
          <Box layoutClassName="flex flex-1 flex-col items-center justify-center gap-3 py-16" textClassName="text-slate-400 dark:text-slate-500">
            <Box layoutClassName="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <XCircle className="h-8 w-8 opacity-30" />
            </Box>
            <Typography size="sm" variant="muted">Chưa có giao dịch nào được đánh dấu ngoài hệ thống</Typography>
          </Box>
        ) : (
          <Box layoutClassName="space-y-2">
            {externalTransactions.map(tr => (
              <ExternalTransactionRow key={tr.id} transaction={tr} onUnmark={handleUnmarkExternal} formatDate={formatDate} />
            ))}
          </Box>
        )
      ) : activeTab === 'invalid' ? (
        invalidTransactions.length === 0 ? (
          <Box layoutClassName="flex flex-1 flex-col items-center justify-center gap-3 py-16" textClassName="text-slate-400 dark:text-slate-500">
            <Box layoutClassName="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 opacity-80" />
            </Box>
            <Typography size="sm" variant="muted">Tất cả giao dịch đã có mã đơn hàng</Typography>
          </Box>
        ) : (
          <TransactionMappingPanel
            transactions={invalidTransactions}
            orders={orders}
            onLink={handleLinkOrder}
            onMarkExternal={handleMarkExternal}
            onUnmarkExternal={handleUnmarkExternal}
            formatDate={formatDate}
          />
        )
      ) : displayedTransactions.length === 0 ? (
        <Box layoutClassName="flex flex-1 flex-col items-center justify-center gap-3 py-16" textClassName="text-slate-400 dark:text-slate-500">
          <Box layoutClassName="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <ArrowRightLeft className="h-8 w-8 opacity-40" />
          </Box>
          <Typography size="sm" variant="muted">{searchTerm ? 'Không tìm thấy giao dịch phù hợp' : t('transactions.noData')}</Typography>
        </Box>
      ) : (
        <>
          <TransactionsMobileList transactions={displayedTransactions} formatDate={formatDate} onTransactionClick={handleTransactionClick} />
          <TransactionsDesktopTable transactions={displayedTransactions} formatDate={formatDate} onTransactionClick={handleTransactionClick} />
        </>
      )}

      <TransactionDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => { setIsDetailModalOpen(false); setSelectedTransaction(null); }}
        transaction={selectedTransaction}
        formatDate={formatDate}
      />
    </Box>
  );
};

export default ReconciliationTab;

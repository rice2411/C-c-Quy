import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ArrowRightLeft,
  Calendar,
  RefreshCw,
  X,
  TrendingUp,
  Banknote,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  BarChart2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOrders } from '@/contexts/OrderContext';
import { useAuth } from '@/contexts/AuthContext';
import { fetchTransactions, markTransactionExternal } from '@/services/transactionService';
import { PaymentStatus } from '@/types/enums';
import { Transaction } from '@/types';
import { formatVND } from '@/utils/format/currencyUtil';
import TransactionsDesktopTable from './components/desktop/TransactionsDesktopTable';
import TransactionsMobileList from './components/mobile/TransactionsMobileList';
import TransactionDetailModal from './components/TransactionDetailModal';
import TransactionMappingPanel from './components/TransactionMappingPanel';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import Typography from '@/components/ui/Typography';

type TabKey = 'all' | 'valid' | 'invalid' | 'external';
type DatePreset = 'today' | '7d' | 'month' | 'last_month' | 'custom';

const fmt = (d: Date) => d.toISOString().split('T')[0];

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'today', label: 'Hôm nay' },
  { key: '7d', label: '7 ngày' },
  { key: 'month', label: 'Tháng này' },
  { key: 'last_month', label: 'Tháng trước' },
];

interface ExternalTransactionRowProps {
  transaction: Transaction;
  onUnmark: (tr: Transaction) => Promise<void>;
  formatDate: (dateStr: string) => string;
}

const ExternalTransactionRow: React.FC<ExternalTransactionRowProps> = ({ transaction: tr, onUnmark, formatDate }) => {
  const [busy, setBusy] = React.useState(false);
  const handle = async () => {
    setBusy(true);
    try { await onUnmark(tr); } finally { setBusy(false); }
  };
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
          <XCircle className="h-4 w-4 text-slate-400" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            +{formatVND(tr.transferAmount)}
          </div>
          <div className="truncate text-xs text-slate-400 dark:text-slate-500">
            {formatDate(tr.transactionDate)}
            {tr.content && ` · ${tr.content}`}
          </div>
        </div>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={handle}
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400 dark:hover:border-orange-600 dark:hover:text-orange-400"
      >
        {busy
          ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-transparent" />
          : <RotateCcw className="h-3.5 w-3.5" />}
        Khôi phục
      </button>
    </div>
  );
};

/* ─── Mini bar chart ─── */
interface RevenueChartProps {
  transactions: Transaction[];
  fromDate: string;
  toDate: string;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ transactions, fromDate, toDate }) => {
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
      // bucket by period start
      const offset = Math.floor((d.getTime() - start.getTime()) / (bucketDays * 86_400_000));
      const key = String(offset);
      map[key] = (map[key] || 0) + tr.transferAmount;
    });

    const count = Math.ceil(diffDays / bucketDays);
    return Array.from({ length: count }, (_, i) => {
      const bucketStart = new Date(start.getTime() + i * bucketDays * 86_400_000);
      return {
        label: bucketDays === 1
          ? `${bucketStart.getDate()}/${bucketStart.getMonth() + 1}`
          : `${bucketStart.getDate()}/${bucketStart.getMonth() + 1}`,
        amount: map[String(i)] || 0,
      };
    });
  }, [transactions, fromDate, toDate]);

  const max = useMemo(() => Math.max(...bars.map(b => b.amount), 1), [bars]);
  const hasData = bars.some(b => b.amount > 0);

  if (!hasData) return null;

  return (
    <Card padding="none" layoutClassName="p-4 overflow-hidden" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
      <Box layoutClassName="mb-3 flex items-center gap-2">
        <BarChart2 className="h-4 w-4 text-orange-500" />
        <Typography size="xs" variant="muted" layoutClassName="font-semibold uppercase tracking-wide">
          Biểu đồ doanh thu
        </Typography>
      </Box>
      <div className="flex items-end gap-0.5 overflow-x-auto pb-1" style={{ height: 72 }}>
        {bars.map((b, i) => {
          const heightPct = b.amount > 0 ? Math.max(8, Math.round((b.amount / max) * 100)) : 0;
          return (
            <div key={i} className="group relative flex min-w-0 flex-1 flex-col items-center justify-end">
              {b.amount > 0 && (
                <div
                  className="absolute bottom-5 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-1 whitespace-nowrap rounded bg-slate-800 px-2 py-0.5 text-[10px] text-white shadow group-hover:flex dark:bg-slate-600"
                >
                  {formatVND(b.amount)}
                </div>
              )}
              <div
                className={`w-full rounded-t transition-all ${b.amount > 0 ? 'bg-orange-400 hover:bg-orange-500 dark:bg-orange-500 dark:hover:bg-orange-400' : 'bg-slate-100 dark:bg-slate-700'}`}
                style={{ height: `${heightPct}%` }}
              />
              {bars.length <= 31 && (
                <span className="mt-1 w-full truncate text-center text-[9px] text-slate-400 dark:text-slate-500">
                  {b.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

/* ─── Main page ─── */
const TransactionsPage: React.FC = () => {
  const { t } = useLanguage();
  const { orders, modifyOrder } = useOrders();
  const { userData } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    return fmt(new Date(d.getFullYear(), d.getMonth(), 1));
  });
  const [toDate, setToDate] = useState(() => fmt(new Date()));
  const [datePreset, setDatePreset] = useState<DatePreset>('month');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const applyPreset = (preset: DatePreset) => {
    const today = new Date();
    if (preset === 'today') {
      setFromDate(fmt(today));
      setToDate(fmt(today));
    } else if (preset === '7d') {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      setFromDate(fmt(from));
      setToDate(fmt(today));
    } else if (preset === 'month') {
      setFromDate(fmt(new Date(today.getFullYear(), today.getMonth(), 1)));
      setToDate(fmt(today));
    } else if (preset === 'last_month') {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      setFromDate(fmt(first));
      setToDate(fmt(last));
    }
    setDatePreset(preset);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error(t('transactions.loadError') || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchTransactions();
      setTransactions(data);
      toast.success(t('transactions.refreshSuccess') || 'Transactions refreshed');
    } catch (error) {
      console.error('Error refreshing transactions:', error);
      toast.error(t('transactions.refreshError') || 'Failed to refresh transactions');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
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

  const validTransactions = useMemo(
    () => baseFiltered.filter(tr => tr.orderNumber && tr.orderNumber.trim() !== ''),
    [baseFiltered],
  );
  const invalidTransactions = useMemo(
    () => baseFiltered.filter(tr => !tr.orderNumber || tr.orderNumber.trim() === ''),
    [baseFiltered],
  );
  const pendingInvalidCount = useMemo(
    () => invalidTransactions.filter(tr => !tr.isExternal).length,
    [invalidTransactions],
  );
  const externalTransactions = useMemo(
    () => baseFiltered.filter(tr => tr.isExternal),
    [baseFiltered],
  );

  const displayedTransactions =
    activeTab === 'valid' ? validTransactions :
    activeTab === 'invalid' ? invalidTransactions :
    activeTab === 'external' ? externalTransactions :
    baseFiltered;

  const totalAmount = useMemo(
    () => validTransactions.reduce((s, tr) => s + tr.transferAmount, 0),
    [validTransactions],
  );
  const avgAmount = useMemo(
    () => validTransactions.length > 0 ? Math.round(totalAmount / validTransactions.length) : 0,
    [totalAmount, validTransactions.length],
  );

  const hasFilters = searchTerm || !fromDate || !toDate;

  const clearFilters = () => {
    setSearchTerm('');
    applyPreset('month');
  };

  const handleTransactionClick = (tr: Transaction) => {
    setSelectedTransaction(tr);
    setIsDetailModalOpen(true);
  };

  const handleLinkOrder = async (orderId: string, transaction: Transaction) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    try {
      await modifyOrder(orderId, {
        ...order,
        sepayId: transaction.sepayId,
        paymentStatus: order.paymentStatus === PaymentStatus.PAID
          ? order.paymentStatus
          : PaymentStatus.PAID,
      });
      setTransactions(prev =>
        prev.map(tr =>
          tr.id === transaction.id
            ? { ...tr, orderNumber: order.orderNumber || orderId }
            : tr
        )
      );
      toast.success(`Đã liên kết GD #${transaction.sepayId} → ${order.orderNumber}`);
    } catch (err: any) {
      toast.error(err?.message || 'Không liên kết được');
      throw err;
    }
  };

  const handleMarkExternal = async (transaction: Transaction) => {
    try {
      await markTransactionExternal(transaction.id, true);
      setTransactions(prev =>
        prev.map(tr => tr.id === transaction.id ? { ...tr, isExternal: true } : tr)
      );
      toast.success('Đã chuyển sang "Ngoài hệ thống"');
    } catch (err: any) {
      toast.error(err?.message || 'Không thể đánh dấu');
      throw err;
    }
  };

  const handleUnmarkExternal = async (transaction: Transaction) => {
    try {
      await markTransactionExternal(transaction.id, false);
      setTransactions(prev =>
        prev.map(tr => tr.id === transaction.id ? { ...tr, isExternal: false } : tr)
      );
      toast.success('Đã khôi phục giao dịch');
    } catch (err: any) {
      toast.error(err?.message || 'Không thể khôi phục');
      throw err;
    }
  };

  const tabs: { key: TabKey; label: string; count: number; icon: React.ReactNode }[] = [
    { key: 'all', label: 'Tất cả', count: baseFiltered.length, icon: <ArrowRightLeft className="h-3.5 w-3.5" /> },
    { key: 'valid', label: 'Hợp lệ', count: validTransactions.length, icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    { key: 'invalid', label: 'Chưa khớp', count: pendingInvalidCount, icon: <AlertTriangle className="h-3.5 w-3.5" /> },
    { key: 'external', label: 'Ngoài HT', count: externalTransactions.length, icon: <XCircle className="h-3.5 w-3.5" /> },
  ];

  return (
    <Box layoutClassName="relative flex h-full flex-col space-y-4 sm:space-y-5">

      {/* ── Header ── */}
      <Box layoutClassName="flex items-center justify-between gap-3">
        <Box layoutClassName="flex items-center gap-3">
          <Box layoutClassName="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
            <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </Box>
          <Box>
            <Typography as="h1" layoutClassName="text-lg font-bold sm:text-xl" textClassName="text-slate-900 dark:text-white">
              {t('transactions.title')}
            </Typography>
            {!loading && (
              <Typography as="p" size="xs" variant="muted">
                {baseFiltered.length} giao dịch • {fromDate && toDate ? `${fromDate.split('-').reverse().join('/')} — ${toDate.split('-').reverse().join('/')}` : ''}
              </Typography>
            )}
          </Box>
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

      {/* ── Stats ── */}
      {!loading && (
        <Box layoutClassName="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card padding="none" layoutClassName="p-4" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
            <Box layoutClassName="flex items-start justify-between">
              <Box>
                <Typography as="p" size="xs" variant="muted" layoutClassName="mb-1 uppercase tracking-wide font-medium">{t('transactions.totalIn')}</Typography>
                <Typography as="p" layoutClassName="text-lg font-bold sm:text-xl" textClassName="text-emerald-600 dark:text-emerald-400">
                  {formatVND(totalAmount)}
                </Typography>
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
                <Typography as="p" layoutClassName="text-lg font-bold sm:text-xl" textClassName="text-orange-600 dark:text-orange-400">
                  {avgAmount > 0 ? formatVND(avgAmount) : '—'}
                </Typography>
              </Box>
              <Box layoutClassName="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-900/20">
                <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </Box>
            </Box>
          </Card>

          <Card padding="none" layoutClassName="p-4" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
            <Box layoutClassName="flex items-start justify-between">
              <Box>
                <Typography as="p" size="xs" variant="muted" layoutClassName="mb-1 uppercase tracking-wide font-medium">Hợp lệ</Typography>
                <Box layoutClassName="flex items-baseline gap-1.5">
                  <Typography as="p" layoutClassName="text-lg font-bold sm:text-xl" textClassName="text-slate-900 dark:text-white">
                    {validTransactions.length}
                  </Typography>
                  {baseFiltered.length > 0 && (
                    <Typography as="span" size="xs" variant="muted">
                      ({Math.round(validTransactions.length / baseFiltered.length * 100)}%)
                    </Typography>
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
                <Typography as="p" layoutClassName="text-lg font-bold sm:text-xl" textClassName={pendingInvalidCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}>
                  {pendingInvalidCount}
                </Typography>
              </Box>
              <Box layoutClassName={`flex h-9 w-9 items-center justify-center rounded-lg ${pendingInvalidCount > 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
                <AlertTriangle className={`h-4 w-4 ${pendingInvalidCount > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400'}`} />
              </Box>
            </Box>
          </Card>
        </Box>
      )}

      {/* ── Filters ── */}
      <Card padding="none" layoutClassName="p-3 sm:p-4 space-y-3" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
        {/* Quick presets */}
        <Box layoutClassName="flex flex-wrap items-center gap-1.5">
          {DATE_PRESETS.map(p => (
            <button
              key={p.key}
              type="button"
              onClick={() => applyPreset(p.key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                datePreset === p.key
                  ? 'border-orange-400 bg-orange-50 text-orange-700 dark:border-orange-600 dark:bg-orange-900/30 dark:text-orange-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:bg-orange-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-orange-700'
              }`}
            >
              {p.label}
            </button>
          ))}
          <span className="ml-1 text-xs text-slate-300 dark:text-slate-600">|</span>
          <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setDatePreset('custom'); }}
            sizeClassName="px-2 py-1 text-xs"
            backgroundClassName="bg-slate-50 dark:bg-slate-700"
            borderClassName="border-slate-200 dark:border-slate-600"
            textClassName="text-slate-700 dark:text-slate-200"
            focusClassName="focus:ring-1"
          />
          <Typography as="span" size="xs" variant="muted">—</Typography>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setDatePreset('custom'); }}
            sizeClassName="px-2 py-1 text-xs"
            backgroundClassName="bg-slate-50 dark:bg-slate-700"
            borderClassName="border-slate-200 dark:border-slate-600"
            textClassName="text-slate-700 dark:text-slate-200"
            focusClassName="focus:ring-1"
          />
        </Box>

        {/* Search */}
        <Box layoutClassName="flex items-center gap-2">
          <Box layoutClassName="flex-1 min-w-0">
            <Input
              type="text"
              placeholder={t('transactions.searchPlaceholder') || 'Tìm nội dung, mã đơn...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search />}
              leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
              backgroundClassName="bg-slate-50 dark:bg-slate-700"
              borderClassName="border-slate-200 dark:border-slate-600"
            />
          </Box>
          {searchTerm && (
            <button type="button" onClick={() => setSearchTerm('')}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700">
              <X className="h-3.5 w-3.5" />Xóa
            </button>
          )}
        </Box>
      </Card>

      {/* ── Revenue Chart ── */}
      {!loading && (activeTab === 'all' || activeTab === 'valid') && (
        <RevenueChart
          transactions={activeTab === 'valid' ? validTransactions : baseFiltered}
          fromDate={fromDate}
          toDate={toDate}
        />
      )}

      {/* ── Tabs ── */}
      {!loading && (
        <Box layoutClassName="flex gap-1 rounded-xl border border-slate-100 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/60">
          {tabs.map(({ key, label, count, icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  active
                    ? 'bg-white shadow-sm text-slate-900 dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                } ${key === 'invalid' && count > 0 && !active ? 'text-amber-600 dark:text-amber-400' : ''}`}
              >
                <span className={active ? 'text-orange-500' : ''}>{icon}</span>
                <span>{label}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  active ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </Box>
      )}

      {/* ── Content ── */}
      {loading ? (
        <Box layoutClassName="flex flex-1 items-center justify-center">
          <Spinner size="lg" textClassName="text-orange-500" />
        </Box>
      ) : activeTab === 'external' ? (
        externalTransactions.length === 0 ? (
          <Box layoutClassName="flex flex-1 flex-col items-center justify-center gap-3 py-16" textClassName="text-slate-400 dark:text-slate-500">
            <Box layoutClassName="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <XCircle className="h-8 w-8 opacity-30" />
            </Box>
            <Typography size="sm" variant="muted">Chưa có giao dịch nào được đánh dấu ngoài hệ thống</Typography>
          </Box>
        ) : (
          <div className="space-y-2">
            {externalTransactions.map(tr => (
              <ExternalTransactionRow
                key={tr.id}
                transaction={tr}
                onUnmark={handleUnmarkExternal}
                formatDate={formatDate}
              />
            ))}
          </div>
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
          <Typography size="sm" variant="muted">
            {hasFilters ? 'Không tìm thấy giao dịch phù hợp' : t('transactions.noData')}
          </Typography>
          {hasFilters && (
            <button type="button" onClick={clearFilters}
              className="text-xs font-medium text-orange-600 hover:underline dark:text-orange-400">
              Xóa bộ lọc
            </button>
          )}
        </Box>
      ) : (
        <>
          <TransactionsMobileList
            transactions={displayedTransactions}
            formatDate={formatDate}
            onTransactionClick={handleTransactionClick}
          />
          <TransactionsDesktopTable
            transactions={displayedTransactions}
            formatDate={formatDate}
            onTransactionClick={handleTransactionClick}
          />
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

export default TransactionsPage;

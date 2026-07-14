import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTransactions } from '@/hooks/queries/useTransactionsQuery';
import { formatVND } from '@/utils/format/currencyUtil';
import StatsBanner from '@/components/ui/StatsBanner';
import FilterToolbar from '@/components/shared/FilterToolbar';
import Box from '@/components/ui/Box';
import Spinner from '@/components/ui/Spinner';
import Typography from '@/components/ui/Typography';
import TransactionsDesktopTable from './components/desktop/TransactionsDesktopTable';
import TransactionsMobileList from './components/mobile/TransactionsMobileList';
import TransactionDetailModal from './components/TransactionDetailModal';
import BankStatsCard from './components/BankStatsCard';
import { Transaction } from '@/types';

// Tab "Lịch sử": thống kê (tổng vào/ra + theo ngân hàng) + danh sách giao dịch.
// (Đối soát tách thành tab riêng ở trang Giao dịch.)
const TransactionsSummary: React.FC<{ fromDate: string; toDate: string }> = ({ fromDate, toDate }) => {
  const { t } = useLanguage();
  const { transactions, loading, error } = useTransactions();
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  React.useEffect(() => {
    if (error) toast.error(t('transactions.loadError') || 'Không tải được giao dịch');
  }, [error, t]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch { return dateStr; }
  };

  const filtered = useMemo(() => {
    let list = transactions;
    if (fromDate) {
      const from = new Date(fromDate);
      list = list.filter(tr => new Date(tr.transactionDate) >= from);
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      list = list.filter(tr => new Date(tr.transactionDate) <= to);
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(tr =>
        (tr.content && tr.content.toLowerCase().includes(q)) ||
        (tr.orderNumber && tr.orderNumber.toLowerCase().includes(q)) ||
        (tr.description && tr.description.toLowerCase().includes(q)) ||
        (tr.accountNumber && tr.accountNumber.toLowerCase().includes(q))
      );
    }
    return list;
  }, [transactions, fromDate, toDate, searchTerm]);

  const totalIn = useMemo(
    () => filtered.filter(tr => tr.transferType === 'in').reduce((s, tr) => s + tr.transferAmount, 0),
    [filtered],
  );
  const totalOut = useMemo(
    () => filtered.filter(tr => tr.transferType === 'out').reduce((s, tr) => s + tr.transferAmount, 0),
    [filtered],
  );

  const handleClick = (tr: Transaction) => { setSelected(tr); setDetailOpen(true); };

  if (loading) {
    return <Box layoutClassName="flex flex-1 items-center justify-center py-16"><Spinner size="lg" textClassName="text-primary-500" /></Box>;
  }

  return (
    <Box layoutClassName="space-y-4">
      <StatsBanner
        items={[
          { icon: TrendingUp, label: 'Tổng tiền vào', value: formatVND(totalIn), accent: '#16a34a' },
          { icon: ArrowDownLeft, label: 'Tổng tiền ra', value: formatVND(totalOut), accent: '#e11d48' },
        ]}
      />

      <BankStatsCard transactions={filtered} />

      <FilterToolbar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('transactions.searchPlaceholder') || 'Tìm nội dung, mã đơn...'}
      />

      {filtered.length === 0 ? (
        <Box layoutClassName="flex flex-1 flex-col items-center justify-center gap-3 py-16" textClassName="text-slate-400 dark:text-slate-500">
          <Typography size="sm" variant="muted">{searchTerm ? 'Không tìm thấy giao dịch phù hợp' : t('transactions.noData')}</Typography>
        </Box>
      ) : (
        <>
          <TransactionsMobileList transactions={filtered} formatDate={formatDate} onTransactionClick={handleClick} />
          <TransactionsDesktopTable transactions={filtered} formatDate={formatDate} onTransactionClick={handleClick} />
        </>
      )}

      <TransactionDetailModal
        isOpen={detailOpen}
        onClose={() => { setDetailOpen(false); setSelected(null); }}
        transaction={selected}
        formatDate={formatDate}
      />
    </Box>
  );
};

export default TransactionsSummary;

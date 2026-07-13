import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, TrendingUp, ArrowRightLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTransactions } from '@/hooks/queries/useTransactionsQuery';
import { formatVND } from '@/utils/format/currencyUtil';
import StatsBanner from '@/components/ui/StatsBanner';
import FilterToolbar from '@/components/shared/FilterToolbar';
import BaseModal from '@/components/BaseModal';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Typography from '@/components/ui/Typography';
import TransactionsDesktopTable from './components/desktop/TransactionsDesktopTable';
import TransactionsMobileList from './components/mobile/TransactionsMobileList';
import TransactionDetailModal from './components/TransactionDetailModal';
import BankStatsCard from './components/BankStatsCard';
import ReconciliationTab from './ReconciliationTab';
import { Transaction } from '@/types';

// Màn Giao dịch: thống kê (tổng vào/ra + theo ngân hàng) + lịch sử giao dịch.
// Đối soát (khớp đơn / hoàn tiền / kết toán) mở dạng modal từ nút trên toolbar.
const TransactionsSummary: React.FC<{ fromDate: string; toDate: string }> = ({ fromDate, toDate }) => {
  const { t } = useLanguage();
  const { transactions, loading, error } = useTransactions();
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [reconcileOpen, setReconcileOpen] = useState(false);

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
        actions={
          <Button
            type="button"
            onClick={() => setReconcileOpen(true)}
            variant="ghost"
            disableVariantHover
            disableVariantTextColor
            layoutClassName="flex shrink-0 items-center gap-1.5"
            roundedClassName="rounded-xl"
            borderClassName="border border-slate-200 hover:border-primary-300 dark:border-slate-700"
            backgroundClassName="bg-white hover:bg-primary-50 dark:bg-slate-800"
            sizeClassName="px-3 py-2.5 text-xs"
            textClassName="font-medium text-slate-600 hover:text-primary-600 dark:text-slate-300"
            stateClassName="transition-colors">
            <ArrowRightLeft className="h-4 w-4" /> Đối soát
          </Button>
        }
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

      <BaseModal
        isOpen={reconcileOpen}
        onClose={() => setReconcileOpen(false)}
        title="Đối soát giao dịch"
        size="xl"
      >
        <ReconciliationTab fromDate={fromDate} toDate={toDate} />
      </BaseModal>
    </Box>
  );
};

export default TransactionsSummary;

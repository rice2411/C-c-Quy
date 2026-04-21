import React, { useState, useEffect, useMemo } from 'react';
import { Search, ArrowRightLeft, Calendar, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchTransactions } from '@/services/transactionService';
import { Transaction } from '@/types';
import toast from 'react-hot-toast';
import TransactionsDesktopTable from './components/desktop/TransactionsDesktopTable';
import TransactionsMobileList from './components/mobile/TransactionsMobileList';
import TransactionDetailModal from './components/TransactionDetailModal';
import Box from '@/components/ui/Box';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import Typography from '@/components/ui/Typography';

const TransactionsPage: React.FC = () => {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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

  useEffect(() => {
    loadData();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  const filteredTransactions = useMemo(() => {
    // Chỉ lấy giao dịch tiền vào
    let filtered = transactions.filter(tr => tr.transferType === 'in');

    if (fromDate) {
      const from = new Date(fromDate);
      filtered = filtered.filter(tr => {
        const date = new Date(tr.transactionDate);
        return date >= from;
      });
    }

    if (toDate) {
      const to = new Date(toDate);
      // set to end of day
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(tr => {
        const date = new Date(tr.transactionDate);
        return date <= to;
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(tr => 
        (tr.content && tr.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tr.orderNumber && tr.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tr.description && tr.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tr.accountNumber && tr.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered;
  }, [transactions, searchTerm, fromDate, toDate]);

  return (
    <Box layoutClassName="relative flex h-full flex-col space-y-4 sm:space-y-6">
      <Box layoutClassName="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <Typography
          as="span"
          layoutClassName="flex items-center gap-2 text-xl font-bold sm:text-2xl"
          textClassName="text-slate-800 dark:text-white"
        >
          <ArrowRightLeft className="h-6 w-6 text-orange-500 sm:h-7 sm:w-7" />
          {t('transactions.title')}
        </Typography>
        <Box layoutClassName="flex w-full items-center gap-2 sm:w-auto">
          <IconButton
            type="button"
            label={t('transactions.refresh') || 'Refresh'}
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="secondary"
            layoutClassName="rounded-lg p-2"
            backgroundClassName="bg-white dark:bg-slate-800"
            borderClassName="border border-slate-200 dark:border-slate-700"
            textClassName="text-slate-600 dark:text-slate-400"
            hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700"
            stateClassName="transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </IconButton>
          <Box layoutClassName="relative flex-1 sm:w-72">
            <Input
              type="text"
              placeholder={t('transactions.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search />}
              leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
              backgroundClassName="bg-white dark:bg-slate-800"
              borderClassName="border-slate-200 dark:border-slate-700"
              shadowClassName="shadow-sm"
            />
          </Box>
        </Box>
      </Box>

      <Box layoutClassName="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <Box layoutClassName="flex items-center gap-2 text-xs sm:text-sm" textClassName="text-slate-600 dark:text-slate-300">
          <Calendar className="h-4 w-4 text-slate-400" />
          <Typography as="span" size="sm" variant="secondary">
            {t('transactions.dateRange') || 'Khoảng ngày:'}
          </Typography>
        </Box>
        <Box layoutClassName="flex w-full flex-row flex-wrap gap-2 sm:w-auto">
          <Box layoutClassName="flex items-center gap-2">
            <Typography as="span" size="xs" variant="muted">
              {t('transactions.from') || 'Từ'}
            </Typography>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              sizeClassName="px-2 py-1.5 text-xs sm:text-sm"
              borderClassName="border-slate-200 dark:border-slate-700"
              backgroundClassName="bg-white dark:bg-slate-800"
              textClassName="text-slate-700 dark:text-slate-200"
              focusClassName="focus:ring-1"
            />
          </Box>
          <Box layoutClassName="flex items-center gap-2">
            <Typography as="span" size="xs" variant="muted">
              {t('transactions.to') || 'Đến'}
            </Typography>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              sizeClassName="px-2 py-1.5 text-xs sm:text-sm"
              borderClassName="border-slate-200 dark:border-slate-700"
              backgroundClassName="bg-white dark:bg-slate-800"
              textClassName="text-slate-700 dark:text-slate-200"
              focusClassName="focus:ring-1"
            />
          </Box>
        </Box>
        <Typography as="span" size="sm" variant="muted" layoutClassName="ml-auto">
          {filteredTransactions.length} {t('transactions.results') || 'kết quả'}
        </Typography>
      </Box>

      {loading ? (
        <Box layoutClassName="flex flex-1 items-center justify-center">
          <Spinner size="lg" textClassName="text-orange-500" />
        </Box>
      ) : filteredTransactions.length === 0 ? (
        <Box
          layoutClassName="flex flex-1 flex-col items-center justify-center"
          textClassName="text-slate-400 dark:text-slate-500"
        >
          <ArrowRightLeft className="mb-4 h-16 w-16 opacity-20" />
          <Typography layoutClassName="mb-4">{t('transactions.noData')}</Typography>
        </Box>
      ) : (
        <>
          <TransactionsMobileList 
            transactions={filteredTransactions} 
            formatDate={formatDate}
            onTransactionClick={(tr) => {
              setSelectedTransaction(tr);
              setIsDetailModalOpen(true);
            }}
          />
          <TransactionsDesktopTable 
            transactions={filteredTransactions} 
            formatDate={formatDate}
            onTransactionClick={(tr) => {
              setSelectedTransaction(tr);
              setIsDetailModalOpen(true);
            }}
          />
        </>
      )}

      <TransactionDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        formatDate={formatDate}
      />
    </Box>
  );
};

export default TransactionsPage;
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, ArrowRightLeft, Calendar, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchTransactions } from '@/services/transactionService';
import { Transaction } from '@/types';
import toast from 'react-hot-toast';
import TransactionsDesktopTable from './components/desktop/TransactionsDesktopTable';
import TransactionsMobileList from './components/mobile/TransactionsMobileList';
import TransactionDetailModal from './components/TransactionDetailModal';

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
    <div className="h-full relative flex flex-col space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <ArrowRightLeft className="w-6 h-6 sm:w-7 sm:h-7 text-orange-500" />
          {t('transactions.title')}
        </h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            title={t('transactions.refresh') || 'Refresh'}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t('transactions.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{t('transactions.dateRange') || 'Khoảng ngày:'}</span>
        </div>
        <div className="flex flex-row flex-wrap gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">{t('transactions.from') || 'Từ'}</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">{t('transactions.to') || 'Đến'}</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
        <span className="ml-auto text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          {filteredTransactions.length} {t('transactions.results') || 'kết quả'}
        </span>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      ) : filteredTransactions.length === 0 ? (
         <div className="flex flex-col items-center justify-center flex-1 text-slate-400 dark:text-slate-500">
           <ArrowRightLeft className="w-16 h-16 mb-4 opacity-20" />
           <p className="mb-4">{t('transactions.noData')}</p>
         </div>
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
    </div>
  );
};

export default TransactionsPage;
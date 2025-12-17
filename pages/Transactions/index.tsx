import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, ArrowRightLeft, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchTransactions } from '@/services/transactionService';
import { Transaction } from '@/types';

const TransactionsPage: React.FC = () => {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchTransactions();
      setTransactions(data);
      setLoading(false);
    };
    loadData();
  }, []);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
      try {
        return new Date(dateStr).toLocaleString();
      } catch (e) {
        return dateStr;
      }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tr => 
       (tr.content && tr.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
       (tr.orderNumber && tr.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
       (tr.description && tr.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [transactions, searchTerm]);

  return (
    <div className="h-full relative flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-orange-500" />
            {t('transactions.title')}
        </h2>
        <div className="relative w-full sm:w-72">
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
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col flex-1 overflow-hidden">
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-700/50 shadow-sm">
                        <tr className="text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-600">
                            <th className="px-6 py-4">{t('transactions.table.date')}</th>
                            <th className="px-6 py-4">{t('transactions.table.amount')}</th>
                            <th className="px-6 py-4">{t('transactions.table.content')}</th>
                            <th className="px-6 py-4">{t('transactions.table.orderNumber')}</th>
                            <th className="px-6 py-4">{t('transactions.table.gateway')}</th>
                            <th className="px-6 py-4">{t('transactions.table.account')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredTransactions.map((tr) => (
                            <tr key={tr.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3 h-3 text-slate-400" />
                                        {formatDate(tr.transactionDate)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap font-medium">
                                    <span className={tr.transferType === 'in' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                                        {tr.transferType === 'in' ? '+' : '-'}{formatVND(tr.transferAmount)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 max-w-xs truncate" title={tr.content}>
                                    {tr.content}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    {tr.orderNumber ? (
                                        <span className="bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 px-2 py-1 rounded text-xs font-medium font-mono">
                                            {tr.orderNumber}
                                        </span>
                                    ) : <span className="text-slate-400 text-xs">-</span>}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                    {tr.gateway}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 text-xs font-mono">
                                    {tr.subAccount}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
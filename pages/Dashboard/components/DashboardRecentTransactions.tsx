import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, Calendar, CreditCard, Building2 } from 'lucide-react';
import { Transaction } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchTransactions } from '@/services/transactionService';
import { formatVND } from '@/utils/currencyUtil';

const DashboardRecentTransactions: React.FC = () => {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchTransactions();
        setTransactions(data);
      } catch (e) {
        console.error('Error loading recent transactions for dashboard:', e);
      }
    };
    load();
  }, []);

  const recentTransactions = useMemo(
    () =>
      transactions
        .filter((tr) => tr.transferType === 'in')
        .slice(0, 5),
    [transactions]
  );

  if (recentTransactions.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-emerald-500" />
          {t('dashboard.recentTransactions') || 'Recent transactions'}
        </h3>
      </div>
      <div className="space-y-2">
        {recentTransactions.map((tr) => (
          <div
            key={tr.id}
            className="flex items-center justify-between gap-3 px-2.5 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                <ArrowRightLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-300 truncate">
                  +{formatVND(tr.transferAmount)}
                </span>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  <span className="truncate">
                    {new Date(tr.transactionDate).toLocaleString(
                      t('language') === 'vi' ? 'vi-VN' : 'en-US'
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <Building2 className="w-3.5 h-3.5" />
                <span className="truncate max-w-[90px] sm:max-w-[120px]">
                  {tr.gateway || '-'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <CreditCard className="w-3.5 h-3.5" />
                <span className="font-mono truncate max-w-[110px] sm:max-w-[140px]">
                  {tr.subAccount || tr.accountNumber || '-'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardRecentTransactions;



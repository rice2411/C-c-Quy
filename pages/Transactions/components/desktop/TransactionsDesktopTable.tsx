import React from 'react';
import { Calendar, Building2, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import { Transaction } from '@/types';
import { formatVND } from '@/utils/currencyUtil';

interface TransactionsDesktopTableProps {
  transactions: Transaction[];
  formatDate: (dateStr: string) => string;
}

const TransactionsDesktopTable: React.FC<TransactionsDesktopTableProps> = ({
  transactions,
  formatDate,
}) => {
  if (!transactions.length) {
    return null;
  }

  return (
    <div className="hidden lg:flex bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex-col flex-1 overflow-hidden">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-700/50 backdrop-blur-sm shadow-sm">
            <tr className="text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-600">
              <th className="px-4 sm:px-6 py-3">Date</th>
              <th className="px-4 sm:px-6 py-3">Amount</th>
              <th className="px-4 sm:px-6 py-3">Content</th>
              <th className="px-4 sm:px-6 py-3">Order Ref</th>
              <th className="px-4 sm:px-6 py-3">SePay ID</th>
              <th className="px-4 sm:px-6 py-3">Gateway</th>
              <th className="px-4 sm:px-6 py-3">Account</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {transactions.map((tr) => (
              <tr
                key={tr.id}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors group"
              >
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                      {formatDate(tr.transactionDate)}
                    </span>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {tr.transferType === 'in' ? (
                      <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm sm:text-base font-bold ${
                        tr.transferType === 'in'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {tr.transferType === 'in' ? '+' : '-'}
                      {formatVND(tr.transferAmount)}
                    </span>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <div className="max-w-xs">
                    <p
                      className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors"
                      title={tr.content}
                    >
                      {tr.content || '-'}
                    </p>
                    {tr.description && (
                      <p
                        className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5"
                        title={tr.description}
                      >
                        {tr.description}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4">
                  {tr.orderNumber ? (
                    <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 px-2 py-1 rounded-md text-xs font-medium font-mono">
                      {tr.orderNumber}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs">-</span>
                  )}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  {tr.sepayId ? (
                    <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200 px-2 py-1 rounded-md text-[11px] font-mono">
                      #{tr.sepayId}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs">-</span>
                  )}
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      {tr.gateway || '-'}
                    </span>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {tr.subAccount || tr.accountNumber || '-'}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionsDesktopTable;



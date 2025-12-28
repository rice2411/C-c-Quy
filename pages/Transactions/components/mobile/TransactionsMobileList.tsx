import React from 'react';
import { ArrowRightLeft, Calendar, Building2, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import { Transaction } from '@/types';
import { formatVND } from '@/utils/currencyUtil';

interface TransactionsMobileListProps {
  transactions: Transaction[];
  formatDate: (dateStr: string) => string;
  onTransactionClick?: (transaction: Transaction) => void;
}

const TransactionsMobileList: React.FC<TransactionsMobileListProps> = ({
  transactions,
  formatDate,
  onTransactionClick,
}) => {
  if (!transactions.length) {
    return null;
  }

  return (
    <div className="lg:hidden flex-1 overflow-y-auto space-y-3 pb-4">
      {transactions.map((tr) => (
        <div
          key={tr.id}
          onClick={() => onTransactionClick?.(tr)}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm mx-[-0.25rem] sm:mx-0 cursor-pointer hover:shadow-md hover:border-orange-300 dark:hover:border-orange-600 transition-all"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-full border flex items-center justify-center flex-shrink-0 ${
                  tr.transferType === 'in'
                    ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700'
                    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700'
                }`}
              >
                {tr.transferType === 'in' ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div className="flex flex-col">
                <span
                  className={`text-sm font-semibold ${
                    tr.transferType === 'in'
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {tr.transferType === 'in' ? '+' : '-'}
                  {formatVND(tr.transferAmount)}
                </span>
                <div className="flex items-center text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(tr.transactionDate)}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 min-w-0">
              {tr.orderNumber && (
                <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 px-2 py-1 rounded-md text-[10px] font-medium font-mono max-w-[140px] truncate">
                  <ArrowRightLeft className="w-3 h-3" />
                  {tr.orderNumber}
                </span>
              )}
              {tr.sepayId ? (
                <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200 px-2 py-1 rounded-md text-[10px] font-mono max-w-[140px] truncate">
                  SePay #{tr.sepayId}
                </span>
              ) : null}
            </div>
          </div>

          <div className="mb-2">
            <p className="text-xs text-slate-700 dark:text-slate-200 line-clamp-1">
              {tr.content || '-'}
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-1.5 min-w-0">
              <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {tr.gateway || '-'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <CreditCard className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-[120px] text-right">
                {tr.subAccount || tr.accountNumber || '-'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionsMobileList;



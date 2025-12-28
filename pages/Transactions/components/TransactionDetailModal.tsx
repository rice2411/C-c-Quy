import React from 'react';
import {
  Calendar,
  Building2,
  CreditCard,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  FileText,
  Hash,
  DollarSign,
  Clock,
} from 'lucide-react';
import { Transaction } from '@/types';
import { formatVND } from '@/utils/currencyUtil';
import BaseModal from '@/components/BaseModal';
import { useLanguage } from '@/contexts/LanguageContext';

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  formatDate: (dateStr: string) => string;
}

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  onClose,
  transaction,
  formatDate,
}) => {
  const { t } = useLanguage();

  if (!transaction) return null;

  const isIncoming = transaction.transferType === 'in';

  const formatFullDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full border flex items-center justify-center ${
              isIncoming
                ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700'
                : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700'
            }`}
          >
            {isIncoming ? (
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isIncoming ? 'Giao dịch nhận tiền' : 'Giao dịch chuyển tiền'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {formatDate(transaction.transactionDate)}
            </p>
          </div>
        </div>
      }
      size="lg"
    >
      <div className="space-y-4">
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Số tiền</span>
            <span
              className={`text-2xl font-bold ${
                isIncoming
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {isIncoming ? '+' : '-'}
              {formatVND(transaction.transferAmount)}
            </span>
          </div>
          {transaction.accumulated > 0 && (
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Số dư sau giao dịch:</span>
              <span className="font-medium">{formatVND(transaction.accumulated)}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
                Nội dung
              </span>
            </div>
            <p className="text-sm text-slate-900 dark:text-white">
              {transaction.content || '-'}
            </p>
            {transaction.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {transaction.description}
              </p>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
                Cổng thanh toán
              </span>
            </div>
            <p className="text-sm text-slate-900 dark:text-white">
              {transaction.gateway || '-'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {transaction.orderNumber && (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRightLeft className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
                  Mã đơn hàng
                </span>
              </div>
              <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 px-2 py-1 rounded-md text-sm font-medium font-mono">
                {transaction.orderNumber}
              </span>
            </div>
          )}

          {transaction.sepayId && (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
                  SePay ID
                </span>
              </div>
              <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200 px-2 py-1 rounded-md text-sm font-mono">
                #{transaction.sepayId}
              </span>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
              Thông tin tài khoản
            </span>
          </div>
          <div className="space-y-2">
            {transaction.subAccount && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">Tài khoản phụ:</span>
                <span className="text-sm font-mono text-slate-900 dark:text-white">
                  {transaction.subAccount}
                </span>
              </div>
            )}
            {transaction.accountNumber && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">Số tài khoản:</span>
                <span className="text-sm font-mono text-slate-900 dark:text-white">
                  {transaction.accountNumber}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
                Ngày giao dịch
              </span>
            </div>
            <p className="text-sm text-slate-900 dark:text-white">
              {formatFullDate(transaction.transactionDate)}
            </p>
          </div>

          {transaction.receivedAt && (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
                  Ngày nhận
                </span>
              </div>
              <p className="text-sm text-slate-900 dark:text-white">
                {formatFullDate(transaction.receivedAt)}
              </p>
            </div>
          )}
        </div>

        {(transaction.code || transaction.referenceCode) && (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
                Mã tham chiếu
              </span>
            </div>
            <div className="space-y-1">
              {transaction.code && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Code:</span>
                  <span className="text-sm font-mono text-slate-900 dark:text-white">
                    {transaction.code}
                  </span>
                </div>
              )}
              {transaction.referenceCode && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Reference:</span>
                  <span className="text-sm font-mono text-slate-900 dark:text-white">
                    {transaction.referenceCode}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {transaction.createdAt && (
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">ID giao dịch:</span>
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                {transaction.id}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">Tạo lúc:</span>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {formatFullDate(transaction.createdAt)}
              </span>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
};

export default TransactionDetailModal;


import React from 'react';
import { ArrowRightLeft, Calendar, Building2, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import { Transaction } from '@/types';
import { formatVND } from '@/utils/format/currencyUtil';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';

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
    <Box layoutClassName="flex-1 space-y-3 overflow-y-auto pb-4 lg:hidden">
      {transactions.map((tr) => (
        <Card
          key={tr.id}
          onClick={() => onTransactionClick?.(tr)}
          padding="none"
          layoutClassName="mx-[-0.25rem] cursor-pointer p-3 transition-all hover:shadow-md sm:mx-0"
          borderClassName="border-slate-200 hover:border-orange-300 dark:border-slate-700 dark:hover:border-orange-600"
          backgroundClassName="bg-white dark:bg-slate-800"
        >
          <Box layoutClassName="mb-2 flex items-start justify-between gap-2">
            <Box layoutClassName="flex items-center gap-2">
              <Box
                layoutClassName={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                  tr.transferType === 'in'
                    ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700'
                    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700'
                }`}
              >
                {tr.transferType === 'in' ? (
                  <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
              </Box>
              <Box layoutClassName="flex flex-col">
                <Typography
                  as="span"
                  size="sm"
                  layoutClassName="font-semibold"
                  textClassName={
                    tr.transferType === 'in'
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-red-600 dark:text-red-400'
                  }
                >
                  {tr.transferType === 'in' ? '+' : '-'}
                  {formatVND(tr.transferAmount)}
                </Typography>
                <Typography
                  as="span"
                  size="xs"
                  layoutClassName="mt-0.5 flex items-center text-[11px]"
                  textClassName="text-slate-500 dark:text-slate-400"
                >
                  <Calendar className="mr-1 h-3 w-3" />
                  {formatDate(tr.transactionDate)}
                </Typography>
              </Box>
            </Box>
            <Box layoutClassName="flex min-w-0 flex-col items-end gap-1">
              {tr.orderNumber && (
                <Badge
                  size="sm"
                  layoutClassName="inline-flex max-w-[140px] items-center gap-1 truncate px-2 py-1 text-[10px] font-medium font-mono"
                  borderClassName="border-transparent"
                  backgroundClassName="bg-orange-50 dark:bg-orange-900/20"
                  textClassName="text-orange-700 dark:text-orange-300"
                >
                  <ArrowRightLeft className="h-3 w-3" />
                  {tr.orderNumber}
                </Badge>
              )}
              {tr.sepayId ? (
                <Badge
                  size="sm"
                  layoutClassName="inline-flex max-w-[140px] items-center gap-1 truncate px-2 py-1 text-[10px] font-mono"
                  borderClassName="border-transparent"
                  backgroundClassName="bg-slate-50 dark:bg-slate-800/60"
                  textClassName="text-slate-700 dark:text-slate-200"
                >
                  SePay #{tr.sepayId}
                </Badge>
              ) : null}
            </Box>
          </Box>

          <Box layoutClassName="mb-2">
            <Typography size="xs" layoutClassName="line-clamp-1" textClassName="text-slate-700 dark:text-slate-200">
              {tr.content || '-'}
            </Typography>
          </Box>

          <Box layoutClassName="flex items-center justify-between gap-3 border-t border-slate-100 pt-2 dark:border-slate-700">
            <Box layoutClassName="flex min-w-0 items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <Typography as="span" size="xs" layoutClassName="truncate text-[11px]" textClassName="text-slate-500 dark:text-slate-400">
                {tr.gateway || '-'}
              </Typography>
            </Box>
            <Box layoutClassName="flex min-w-0 items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <Typography
                as="span"
                size="xs"
                layoutClassName="max-w-[120px] truncate text-right text-[11px] font-mono"
                textClassName="text-slate-500 dark:text-slate-400"
              >
                {tr.subAccount || tr.accountNumber || '-'}
              </Typography>
            </Box>
          </Box>
        </Card>
      ))}
    </Box>
  );
};

export default TransactionsMobileList;



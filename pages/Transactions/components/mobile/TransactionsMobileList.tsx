import React from 'react';
import { ArrowRightLeft, Building2, TrendingUp } from 'lucide-react';
import { Transaction } from '@/types';
import { formatVND } from '@/utils/format/currencyUtil';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
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
  if (!transactions.length) return null;

  return (
    <Box layoutClassName="flex-1 space-y-2 overflow-y-auto pb-4 lg:hidden">
      {transactions.map((tr) => (
        <Box
          key={tr.id}
          onClick={() => onTransactionClick?.(tr)}
          layoutClassName="group cursor-pointer rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm transition-all hover:border-primary-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-primary-600"
        >
          {/* Top row: amount + order badge */}
          <Box layoutClassName="mb-2.5 flex items-start justify-between gap-2">
            {/* Amount + icon */}
            <Box layoutClassName="flex items-center gap-2.5">
              <Box layoutClassName="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </Box>
              <Box>
                <Typography
                  as="div"
                  layoutClassName="text-base font-bold"
                  textClassName="text-emerald-700 dark:text-emerald-300"
                >
                  +{formatVND(tr.transferAmount)}
                </Typography>
                <Typography
                  as="div"
                  size="xs"
                  textClassName="text-slate-400 dark:text-slate-500"
                >
                  {formatDate(tr.transactionDate)}
                </Typography>
              </Box>
            </Box>

            {/* Badges */}
            <Box layoutClassName="flex flex-col items-end gap-1">
              {tr.orderNumber && (
                <Badge
                  size="sm"
                  layoutClassName="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold font-mono"
                  borderClassName="border border-primary-200 dark:border-primary-700"
                  backgroundClassName="bg-primary-50 dark:bg-primary-900/20"
                  textClassName="text-primary-700 dark:text-primary-300"
                >
                  <ArrowRightLeft className="h-2.5 w-2.5" />
                  {tr.orderNumber}
                </Badge>
              )}
              {tr.sepayId ? (
                <Typography
                  as="div"
                  size="xs"
                  layoutClassName="font-mono text-[10px]"
                  textClassName="text-slate-400 dark:text-slate-500"
                >
                  #{tr.sepayId}
                </Typography>
              ) : null}
            </Box>
          </Box>

          {/* Content */}
          {tr.content && (
            <Typography
              as="div"
              size="xs"
              layoutClassName="mb-2.5 line-clamp-1 rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-slate-700/50"
              textClassName="text-slate-600 dark:text-slate-300"
            >
              {tr.content}
            </Typography>
          )}

          {/* Footer: gateway + account */}
          <Box layoutClassName="flex items-center gap-1.5 text-[11px]" textClassName="text-slate-400 dark:text-slate-500">
            <Building2 className="h-3 w-3 shrink-0" />
            <Typography as="span" layoutClassName="truncate">{tr.gateway || '—'}</Typography>
            {(tr.subAccount || tr.accountNumber) && (
              <>
                <Typography as="span" layoutClassName="mx-1" textClassName="text-slate-300 dark:text-slate-600">·</Typography>
                <Typography as="span" layoutClassName="truncate font-mono">{tr.subAccount || tr.accountNumber}</Typography>
              </>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default TransactionsMobileList;

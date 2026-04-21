import React from 'react';
import { Calendar, Building2, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import { Transaction } from '@/types';
import { formatVND } from '@/utils/currencyUtil';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/Table';

interface TransactionsDesktopTableProps {
  transactions: Transaction[];
  formatDate: (dateStr: string) => string;
  onTransactionClick?: (transaction: Transaction) => void;
}

const TransactionsDesktopTable: React.FC<TransactionsDesktopTableProps> = ({
  transactions,
  formatDate,
  onTransactionClick,
}) => {
  if (!transactions.length) {
    return null;
  }

  return (
    <Card
      padding="none"
      layoutClassName="hidden flex-1 flex-col overflow-hidden lg:flex"
      borderClassName="border-slate-100 dark:border-slate-700"
      backgroundClassName="bg-white dark:bg-slate-800"
    >
      <Box layoutClassName="flex-1 overflow-x-auto">
        <Table>
          <TableHead
            layoutClassName="sticky top-0 z-10 backdrop-blur-sm"
            backgroundClassName="bg-slate-50 dark:bg-slate-700/50"
            borderClassName="border-b border-slate-200 dark:border-slate-600"
            shadowClassName="shadow-sm"
          >
            <TableRow textClassName="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              <TableHeaderCell layoutClassName="px-4 py-3 sm:px-6">Date</TableHeaderCell>
              <TableHeaderCell layoutClassName="px-4 py-3 sm:px-6">Amount</TableHeaderCell>
              <TableHeaderCell layoutClassName="px-4 py-3 sm:px-6">Content</TableHeaderCell>
              <TableHeaderCell layoutClassName="px-4 py-3 sm:px-6">Order Ref</TableHeaderCell>
              <TableHeaderCell layoutClassName="px-4 py-3 sm:px-6">SePay ID</TableHeaderCell>
              <TableHeaderCell layoutClassName="px-4 py-3 sm:px-6">Gateway</TableHeaderCell>
              <TableHeaderCell layoutClassName="px-4 py-3 sm:px-6">Account</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((tr) => (
              <TableRow
                key={tr.id}
                onClick={() => onTransactionClick?.(tr)}
                hoverClassName="hover:bg-slate-50/80 dark:hover:bg-slate-700/30"
                stateClassName="group cursor-pointer transition-colors"
              >
                <TableCell layoutClassName="whitespace-nowrap px-4 py-4 sm:px-6">
                  <Box layoutClassName="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <Typography as="span" size="sm" layoutClassName="font-medium text-xs sm:text-sm" textClassName="text-slate-600 dark:text-slate-300">
                      {formatDate(tr.transactionDate)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell layoutClassName="whitespace-nowrap px-4 py-4 sm:px-6">
                  <Box layoutClassName="flex items-center gap-2">
                    {tr.transferType === 'in' ? (
                      <TrendingUp className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <TrendingDown className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                    )}
                    <Typography
                      as="span"
                      layoutClassName="text-sm font-bold sm:text-base"
                      textClassName={
                        tr.transferType === 'in'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }
                    >
                      {tr.transferType === 'in' ? '+' : '-'}
                      {formatVND(tr.transferAmount)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell layoutClassName="px-4 py-4 sm:px-6">
                  <Box layoutClassName="max-w-xs">
                    <Typography
                      size="sm"
                      layoutClassName="truncate text-xs sm:text-sm"
                      textClassName="text-slate-700 transition-colors group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white"
                      title={tr.content}
                    >
                      {tr.content || '-'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell layoutClassName="px-4 py-4 sm:px-6">
                  {tr.orderNumber ? (
                    <Badge
                      size="sm"
                      layoutClassName="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium font-mono"
                      borderClassName="border-transparent"
                      backgroundClassName="bg-orange-50 dark:bg-orange-900/20"
                      textClassName="text-orange-700 dark:text-orange-300"
                    >
                      {tr.orderNumber}
                    </Badge>
                  ) : (
                    <Typography as="span" size="xs" variant="muted">-</Typography>
                  )}
                </TableCell>
                <TableCell layoutClassName="whitespace-nowrap px-4 py-4 sm:px-6">
                  {tr.sepayId ? (
                    <Badge
                      size="sm"
                      layoutClassName="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-mono"
                      borderClassName="border-transparent"
                      backgroundClassName="bg-slate-50 dark:bg-slate-800/60"
                      textClassName="text-slate-700 dark:text-slate-200"
                    >
                      #{tr.sepayId}
                    </Badge>
                  ) : (
                    <Typography as="span" size="xs" variant="muted">-</Typography>
                  )}
                </TableCell>
                <TableCell layoutClassName="px-4 py-4 sm:px-6">
                  <Box layoutClassName="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    <Typography as="span" size="sm" layoutClassName="text-xs sm:text-sm" textClassName="text-slate-600 dark:text-slate-400">
                      {tr.gateway || '-'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell layoutClassName="px-4 py-4 sm:px-6">
                  <Box layoutClassName="flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                    <Typography as="span" size="xs" layoutClassName="font-mono" textClassName="text-slate-500 dark:text-slate-400">
                      {tr.subAccount || tr.accountNumber || '-'}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Card>
  );
};

export default TransactionsDesktopTable;



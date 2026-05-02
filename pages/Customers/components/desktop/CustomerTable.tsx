import React from 'react';
import { Edit2, Trash2, Phone } from 'lucide-react';
import { Customer } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import IconButton from '@/components/ui/IconButton';
import Typography from '@/components/ui/Typography';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/Table';

interface CustomerTableProps {
  customers: Customer[];
  customerStats: Map<string, number>;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  emptyMessage: string;
}

const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  customerStats,
  onEdit,
  onDelete,
  emptyMessage,
}) => {
  const { t } = useLanguage();

  const getProductCount = (phone: string) => {
    const normalized = phone.replace(/\D/g, '');
    return customerStats.get(normalized) || 0;
  };

  return (
    <Box layoutClassName="hidden min-h-0 flex-1 overflow-auto px-2 pb-3 pt-1 lg:block lg:px-4 lg:pb-4">
      <Box
        layoutClassName="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-700/80"
        backgroundClassName="bg-white dark:bg-slate-800/80"
      >
        <Table>
          <TableHead
            layoutClassName="sticky top-0 z-10"
            backgroundClassName="bg-gradient-to-r from-slate-100 to-orange-50/40 dark:from-slate-800 dark:to-orange-950/20"
            shadowClassName="shadow-sm"
          >
            <TableRow
              borderClassName="border-b border-slate-200/80 dark:border-slate-600"
              textClassName="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
            >
              <TableHeaderCell layoutClassName="py-3.5 pl-4">{t('customers.table.name')}</TableHeaderCell>
              <TableHeaderCell layoutClassName="py-3.5">{t('customers.form.phone')}</TableHeaderCell>
              <TableHeaderCell layoutClassName="py-3.5 text-center">{t('customers.table.totalProducts')}</TableHeaderCell>
              <TableHeaderCell layoutClassName="w-32 py-3.5 pr-4 text-center">{t('customers.table.actions')}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.length > 0 ? (
              customers.map((customer) => (
                <TableRow
                  key={customer.id}
                  hoverClassName="hover:bg-orange-50/40 dark:hover:bg-orange-950/15"
                  stateClassName="transition-colors"
                >
                  <TableCell layoutClassName="pl-4">
                    <Box layoutClassName="flex items-center gap-3">
                      <Box
                        layoutClassName="flex h-9 w-9 shrink-0 items-center justify-center text-sm font-bold shadow-sm"
                        roundedClassName="rounded-full"
                        backgroundClassName="bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/25"
                        textClassName="text-orange-700 dark:text-orange-300"
                      >
                        {customer.name.charAt(0).toUpperCase()}
                      </Box>
                      <Box layoutClassName="min-w-0">
                        <Typography size="sm" variant="primary" textClassName="font-semibold text-slate-900 dark:text-white">
                          {customer.name}
                        </Typography>
                        <Typography size="xs" variant="muted" layoutClassName="font-mono">
                          #{customer.id.substring(0, 6)}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box layoutClassName="inline-flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-2.5 py-1 text-sm dark:border-slate-600 dark:bg-slate-900/50" textClassName="text-slate-700 dark:text-slate-200">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-orange-400 dark:text-orange-500" aria-hidden />
                      <span className="tabular-nums">{customer.phone}</span>
                    </Box>
                  </TableCell>
                  <TableCell layoutClassName="text-center">
                    <Badge
                      size="sm"
                      layoutClassName="inline-flex min-w-[2rem] justify-center px-2.5 py-0.5"
                      borderClassName="border border-orange-200/60 dark:border-orange-800/50"
                      backgroundClassName="bg-orange-50 dark:bg-orange-950/35"
                      textClassName="font-semibold text-orange-800 dark:text-orange-200"
                    >
                      {getProductCount(customer.phone)}
                    </Badge>
                  </TableCell>
                  <TableCell layoutClassName="pr-4 text-center">
                    <Box layoutClassName="flex items-center justify-center gap-1">
                      <IconButton
                        type="button"
                        label="Edit"
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(customer)}
                        layoutClassName="rounded-lg p-2"
                        textClassName="text-slate-400"
                        hoverClassName="hover:bg-orange-100 hover:text-orange-700 dark:hover:bg-orange-900/30 dark:hover:text-orange-300"
                        stateClassName="transition-all"
                      >
                        <Edit2 className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        type="button"
                        label="Delete"
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(customer.id)}
                        layoutClassName="rounded-lg p-2"
                        textClassName="text-slate-400"
                        hoverClassName="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/25 dark:hover:text-red-400"
                        stateClassName="transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  layoutClassName="px-6 py-16 text-center"
                  textClassName="text-slate-500 dark:text-slate-400"
                >
                  <Typography size="sm" variant="muted" layoutClassName="mx-auto max-w-sm leading-relaxed">
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
};

export default CustomerTable;

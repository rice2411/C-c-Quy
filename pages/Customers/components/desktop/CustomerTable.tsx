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
}

const CustomerTable: React.FC<CustomerTableProps> = ({ customers, customerStats, onEdit, onDelete }) => {
  const { t } = useLanguage();

  const getProductCount = (phone: string) => {
    const normalized = phone.replace(/\D/g, '');
    return customerStats.get(normalized) || 0;
  };

  return (
    <Box layoutClassName="hidden flex-1 overflow-auto lg:block">
      <Table>
        <TableHead
          layoutClassName="sticky top-0 z-10"
          backgroundClassName="bg-slate-100 dark:bg-slate-700"
          shadowClassName="shadow-sm"
        >
          <TableRow
            borderClassName="border-b border-slate-200 dark:border-slate-600"
            textClassName="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
          >
            <TableHeaderCell layoutClassName="py-4">{t('customers.table.name')}</TableHeaderCell>
            <TableHeaderCell layoutClassName="py-4">{t('customers.form.phone')}</TableHeaderCell>
            <TableHeaderCell layoutClassName="py-4 text-center">{t('customers.table.totalProducts')}</TableHeaderCell>
            <TableHeaderCell layoutClassName="w-32 py-4 text-center">{t('customers.table.actions')}</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {customers.length > 0 ? (
            customers.map((customer) => (
              <TableRow
                key={customer.id}
                hoverClassName="hover:bg-slate-50/80 dark:hover:bg-slate-700/30"
                stateClassName="transition-colors"
              >
                <TableCell>
                  <Box layoutClassName="flex items-center gap-3">
                    <Box
                      layoutClassName="flex h-8 w-8 items-center justify-center text-sm font-bold"
                      roundedClassName="rounded-full"
                      backgroundClassName="bg-orange-100 dark:bg-orange-900/30"
                      textClassName="text-orange-600 dark:text-orange-400"
                    >
                      {customer.name.charAt(0).toUpperCase()}
                    </Box>
                    <Box>
                      <Typography size="sm" variant="primary" textClassName="font-medium">
                        {customer.name}
                      </Typography>
                      <Typography size="xs" variant="muted">
                        #{customer.id.substring(0, 6)}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box layoutClassName="flex items-center gap-2 text-sm" textClassName="text-slate-700 dark:text-slate-300">
                    <Phone className="h-3 w-3 text-slate-400" />
                    {customer.phone}
                  </Box>
                </TableCell>
                <TableCell layoutClassName="text-center">
                  <Badge
                    size="sm"
                    layoutClassName="inline-flex justify-center px-2.5 py-0.5"
                    borderClassName="border-transparent"
                    backgroundClassName="bg-blue-100 dark:bg-blue-900/30"
                    textClassName="font-medium text-blue-800 dark:text-blue-300"
                  >
                    {getProductCount(customer.phone)}
                  </Badge>
                </TableCell>
                <TableCell layoutClassName="text-center">
                  <Box layoutClassName="flex items-center justify-center gap-2">
                    <IconButton
                      type="button"
                      label="Edit"
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(customer)}
                      layoutClassName="rounded-lg p-2"
                      textClassName="text-slate-400"
                      hoverClassName="hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/20 dark:hover:text-orange-400"
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
                      hoverClassName="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
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
                layoutClassName="px-6 py-12 text-center"
                textClassName="text-slate-400 dark:text-slate-500"
              >
                {t('customers.noData')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  );
};

export default CustomerTable;

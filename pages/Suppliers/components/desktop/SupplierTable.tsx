import React from 'react';
import { Edit2, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import { Supplier, SupplierType } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';  
import Box from '@/components/ui/Box';
import IconButton from '@/components/ui/IconButton';
import Typography from '@/components/ui/Typography';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/Table';

interface SupplierTableProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (id: string) => void;
}

const SupplierTable: React.FC<SupplierTableProps> = ({ suppliers, onEdit, onDelete }) => {
  const { t } = useLanguage();

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
            <TableHeaderCell layoutClassName="py-4">{t('suppliers.table.name')}</TableHeaderCell>
            <TableHeaderCell layoutClassName="py-4">{t('suppliers.form.type')}</TableHeaderCell>
            <TableHeaderCell layoutClassName="py-4">{t('suppliers.table.contact')}</TableHeaderCell>
            <TableHeaderCell layoutClassName="py-4">{t('suppliers.form.phone')}</TableHeaderCell>
            <TableHeaderCell layoutClassName="py-4">{t('suppliers.form.email')}</TableHeaderCell>
            <TableHeaderCell layoutClassName="py-4">{t('suppliers.form.address')}</TableHeaderCell>
            <TableHeaderCell layoutClassName="w-32 py-4 text-center">{t('suppliers.table.actions')}</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {suppliers.length > 0 ? (
            suppliers.map((supplier) => (
              <TableRow
                key={supplier.id}
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
                      {supplier.name.charAt(0).toUpperCase()}
                    </Box>
                    <Box>
                      <Typography size="sm" layoutClassName="font-medium">{supplier.name}</Typography>
                      <Typography size="xs" variant="muted">#{supplier.id.substring(0, 6)}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell layoutClassName="text-sm" textClassName="text-slate-700 dark:text-slate-300">
                  {t(`suppliers.form.types.${(supplier.type || SupplierType.GROCERY).toString().toLowerCase()}`)}
                </TableCell>
                <TableCell layoutClassName="text-sm" textClassName="text-slate-700 dark:text-slate-300">
                  {supplier.contactName || '-'}
                </TableCell>
                <TableCell>
                  <Box layoutClassName="flex items-center gap-2 text-sm" textClassName="text-slate-700 dark:text-slate-300">
                    <Phone className="h-3 w-3 text-slate-400" />
                    {supplier.phone || '-'}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box layoutClassName="flex items-center gap-2 text-sm" textClassName="text-slate-700 dark:text-slate-300">
                    <Mail className="h-3 w-3 text-slate-400" />
                    {supplier.email || '-'}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box layoutClassName="flex items-center gap-2 text-sm" textClassName="text-slate-700 dark:text-slate-300">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    {supplier.address || '-'}
                  </Box>
                </TableCell>
                <TableCell layoutClassName="text-center">
                  <Box layoutClassName="flex items-center justify-center gap-2">
                    <IconButton
                      type="button"
                      label="Edit"
                      onClick={() => onEdit(supplier)}
                      variant="ghost"
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
                      onClick={() => onDelete(supplier.id)}
                      variant="ghost"
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
              <TableCell colSpan={7} layoutClassName="px-6 py-12 text-center" textClassName="text-slate-400 dark:text-slate-500">
                {t('suppliers.noData')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  );
};

export default SupplierTable;


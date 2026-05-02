import React from 'react';
import { Edit2, Trash2, Phone, ShoppingBag } from 'lucide-react';
import { Customer } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import IconButton from '@/components/ui/IconButton';
import Typography from '@/components/ui/Typography';

interface CustomerCardProps {
  customer: Customer;
  productCount: number;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ customer, productCount, onEdit, onDelete }) => {
  const { t } = useLanguage();

  return (
    <Card
      padding="none"
      layoutClassName="group relative overflow-hidden"
      borderClassName="border border-slate-200/90 dark:border-slate-600/80"
      backgroundClassName="bg-white dark:bg-slate-800"
      roundedClassName="rounded-2xl"
      shadowClassName="shadow-sm transition-shadow hover:shadow-md dark:shadow-none dark:hover:shadow-lg dark:hover:shadow-black/20"
    >
      <Box
        layoutClassName="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-orange-500 to-amber-500"
        aria-hidden
      />
      <Box layoutClassName="relative p-4 pl-5">
        <Box layoutClassName="mb-3 flex items-start justify-between gap-2">
          <Box layoutClassName="flex min-w-0 flex-1 items-center gap-3">
            <Box
              layoutClassName="flex h-11 w-11 shrink-0 items-center justify-center text-base font-bold shadow-sm"
              roundedClassName="rounded-full"
              backgroundClassName="bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/45 dark:to-amber-900/25"
              textClassName="text-orange-700 dark:text-orange-300"
            >
              {customer.name.charAt(0).toUpperCase()}
            </Box>
            <Box layoutClassName="min-w-0 flex-1">
              <Typography size="sm" layoutClassName="font-semibold text-slate-900 dark:text-white">
                {customer.name}
              </Typography>
              <Typography size="xs" variant="muted" layoutClassName="font-mono">
                #{customer.id.substring(0, 6)}
              </Typography>
            </Box>
          </Box>
          <Box layoutClassName="flex shrink-0 gap-0.5">
            <IconButton
              type="button"
              label="Edit"
              size="sm"
              variant="ghost"
              onClick={() => onEdit(customer)}
              layoutClassName="rounded-xl p-2"
              textClassName="text-slate-400"
              hoverClassName="hover:bg-orange-100 hover:text-orange-700 dark:hover:bg-orange-900/35 dark:hover:text-orange-300"
              stateClassName="transition-colors"
            >
              <Edit2 className="h-4 w-4" />
            </IconButton>
            <IconButton
              type="button"
              label="Delete"
              size="sm"
              variant="ghost"
              onClick={() => onDelete(customer.id)}
              layoutClassName="rounded-xl p-2"
              textClassName="text-slate-400"
              hoverClassName="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/25 dark:hover:text-red-400"
              stateClassName="transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </Box>
        </Box>

        <Box layoutClassName="flex flex-wrap items-center gap-2">
          {customer.phone ? (
            <Box
              layoutClassName="inline-flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-2 dark:border-slate-600 dark:bg-slate-900/50"
              textClassName="text-sm text-slate-700 dark:text-slate-200"
            >
              <Phone className="h-3.5 w-3.5 shrink-0 text-orange-500" aria-hidden />
              <Typography as="span" layoutClassName="truncate tabular-nums">
                {customer.phone}
              </Typography>
            </Box>
          ) : null}
          <Badge
            size="sm"
            layoutClassName="inline-flex items-center gap-1.5 px-2.5 py-1.5"
            borderClassName="border border-orange-200/70 dark:border-orange-800/50"
            backgroundClassName="bg-orange-50 dark:bg-orange-950/35"
            textClassName="text-xs font-semibold text-orange-900 dark:text-orange-100"
          >
            <ShoppingBag className="h-3.5 w-3.5 opacity-80" aria-hidden />
            {t('customers.table.totalProducts')}: {productCount}
          </Badge>
        </Box>
      </Box>
    </Card>
  );
};

export default CustomerCard;

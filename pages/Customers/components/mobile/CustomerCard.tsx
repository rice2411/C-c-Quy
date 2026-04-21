import React from 'react';
import { Edit2, Trash2, Phone, ShoppingBag } from 'lucide-react';
import { Customer } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
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
      layoutClassName="group relative p-4"
      borderClassName="border border-slate-200 dark:border-slate-700"
      backgroundClassName="bg-white dark:bg-slate-800"
      roundedClassName="rounded-xl"
      shadowClassName="shadow-sm"
    >
      <Box layoutClassName="mb-3 flex items-start justify-between">
        <Box layoutClassName="flex items-center gap-3">
          <Box
            layoutClassName="flex h-10 w-10 items-center justify-center text-lg font-bold"
            roundedClassName="rounded-full"
            backgroundClassName="bg-orange-100 dark:bg-orange-900/30"
            textClassName="text-orange-600 dark:text-orange-400"
          >
            {customer.name.charAt(0).toUpperCase()}
          </Box>
          <Box>
            <Heading level={3} textClassName="font-semibold text-slate-900 dark:text-white">
              {customer.name}
            </Heading>
            <Typography size="xs" variant="muted">
              ID: {customer.id.substring(0, 6)}
            </Typography>
          </Box>
        </Box>
        <Box layoutClassName="flex gap-2">
          <IconButton
            type="button"
            label="Edit"
            size="sm"
            variant="ghost"
            onClick={() => onEdit(customer)}
            layoutClassName="rounded-lg p-2"
            textClassName="text-slate-400"
            hoverClassName="hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/20 dark:hover:text-orange-400"
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
            layoutClassName="rounded-lg p-2"
            textClassName="text-slate-400"
            hoverClassName="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            stateClassName="transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </Box>
      </Box>

      <Box layoutClassName="space-y-2 text-sm text-slate-600 dark:text-slate-300">
        {customer.phone ? (
          <Box layoutClassName="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-slate-400" />
            <Typography as="span">{customer.phone}</Typography>
          </Box>
        ) : null}
        <Box layoutClassName="flex items-center gap-2">
          <ShoppingBag className="h-3.5 w-3.5 text-slate-400" />
          <Typography as="span" textClassName="font-medium">
            {t('customers.table.totalProducts')}: {productCount}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
};

export default CustomerCard;

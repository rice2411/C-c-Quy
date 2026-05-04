import React from 'react';
import { Search } from 'lucide-react';
import { Customer } from '@/types';
import CustomerCard from './CustomerCard';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';

interface CustomerCardListProps {
  customers: Customer[];
  customerStats: Map<string, number>;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onOpenDetail?: (customer: Customer) => void;
  onSavePhone?: (customerId: string, phone: string) => void | Promise<void>;
  emptyMessage: string;
}

const CustomerCardList: React.FC<CustomerCardListProps> = ({
  customers,
  customerStats,
  onEdit,
  onDelete,
  onOpenDetail,
  onSavePhone,
  emptyMessage,
}) => {
  const getProductCount = (phone: string | undefined) => {
    const normalized = (phone ?? '').replace(/\D/g, '');
    return customerStats.get(normalized) || 0;
  };

  return (
    <Box
      layoutClassName="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6"
      backgroundClassName="bg-gradient-to-b from-slate-50/80 to-transparent dark:from-slate-900/40 dark:to-transparent"
    >
      {customers.length > 0 ? (
        <Box layoutClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {customers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              productCount={getProductCount(customer.phone)}
              onEdit={onEdit}
              onDelete={onDelete}
              onOpenDetail={onOpenDetail}
              onSavePhone={onSavePhone}
            />
          ))}
        </Box>
      ) : (
        <Box
          layoutClassName="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 py-14 dark:border-slate-600"
          backgroundClassName="bg-white/80 dark:bg-slate-800/50"
        >
          <Box
            layoutClassName="flex h-12 w-12 items-center justify-center rounded-xl"
            backgroundClassName="bg-orange-100 dark:bg-orange-900/35"
          >
            <Search className="h-5 w-5 text-orange-600 dark:text-orange-400" aria-hidden />
          </Box>
          <Typography size="sm" layoutClassName="max-w-xs px-4 text-center leading-relaxed text-slate-600 dark:text-slate-300">
            {emptyMessage}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CustomerCardList;

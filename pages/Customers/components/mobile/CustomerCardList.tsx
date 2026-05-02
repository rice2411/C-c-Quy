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
  emptyMessage: string;
}

const CustomerCardList: React.FC<CustomerCardListProps> = ({
  customers,
  customerStats,
  onEdit,
  onDelete,
  emptyMessage,
}) => {
  const getProductCount = (phone: string) => {
    const normalized = phone.replace(/\D/g, '');
    return customerStats.get(normalized) || 0;
  };

  return (
    <Box
      layoutClassName="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 lg:hidden"
      backgroundClassName="bg-gradient-to-b from-slate-50/80 to-transparent dark:from-slate-900/40 dark:to-transparent"
    >
      {customers.length > 0 ? (
        customers.map((customer) => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            productCount={getProductCount(customer.phone)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
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

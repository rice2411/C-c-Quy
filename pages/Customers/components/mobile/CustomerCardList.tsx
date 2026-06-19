import React from 'react';
import { Users } from 'lucide-react';
import { Customer } from '@/types';
import CustomerCard from './CustomerCard';
import Box from '@/components/ui/Box';
import EmptyState from '@/components/ui/EmptyState';

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
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title={emptyMessage}
          layoutClassName="flex-1 !min-h-0"
        />
      )}
    </Box>
  );
};

export default CustomerCardList;

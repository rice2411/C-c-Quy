import React from 'react';
import { Customer } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import CustomerCard from './CustomerCard';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';

interface CustomerCardListProps {
  customers: Customer[];
  customerStats: Map<string, number>;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
}

const CustomerCardList: React.FC<CustomerCardListProps> = ({ customers, customerStats, onEdit, onDelete }) => {
  const { t } = useLanguage();

  const getProductCount = (phone: string) => {
    const normalized = phone.replace(/\D/g, '');
    return customerStats.get(normalized) || 0;
  };

  return (
    <Box
      layoutClassName="flex flex-1 flex-col space-y-4 overflow-y-auto p-4 lg:hidden"
      backgroundClassName="bg-slate-50/50 dark:bg-slate-900/50"
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
        <Typography size="sm" layoutClassName="py-10 text-center" variant="muted">
          {t('customers.noData')}
        </Typography>
      )}
    </Box>
  );
};

export default CustomerCardList;

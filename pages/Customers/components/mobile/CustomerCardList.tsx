import React from 'react';
import { Customer } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import CustomerCard from './CustomerCard';

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
    <div className="lg:hidden p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50 flex-1 overflow-y-auto">
      {customers.length > 0 ? (
        customers.map(customer => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            productCount={getProductCount(customer.phone)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      ) : (
        <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">{t('customers.noData')}</div>
      )}
    </div>
  );
};

export default CustomerCardList;


import React, { useState, useMemo } from 'react';
import { Customer } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import CustomerFilters from './CustomerFilters';
import CustomerTable from './desktop/CustomerTable';
import CustomerCardList from './mobile/CustomerCardList';
import Card from '@/components/ui/Card';

interface CustomerListProps {
  customers: Customer[];
  customerStats: Map<string, number>;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
}

const CustomerList: React.FC<CustomerListProps> = ({ customers, customerStats, onEdit, onDelete }) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = useMemo(
    () =>
      customers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.phone.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [customers, searchTerm]
  );

  const emptyMessage = useMemo(() => {
    if (filteredCustomers.length > 0) return '';
    if (searchTerm.trim() && customers.length > 0) return t('customers.searchEmpty');
    return t('customers.noData');
  }, [filteredCustomers.length, searchTerm, customers.length, t]);

  const toolbarHint = t('customers.listToolbarHint')
    .replace('{{filtered}}', String(filteredCustomers.length))
    .replace('{{total}}', String(customers.length));

  return (
    <Card
      padding="none"
      layoutClassName="flex h-full min-h-0 flex-1 flex-col overflow-hidden animate-fade-in"
      borderClassName="border border-slate-200/90 dark:border-slate-700"
      backgroundClassName="bg-white dark:bg-slate-800"
      roundedClassName="rounded-2xl"
      shadowClassName="shadow-sm shadow-slate-200/40 dark:shadow-none"
      stateClassName="transition-colors"
    >
      <CustomerFilters searchTerm={searchTerm} onSearchChange={setSearchTerm} toolbarHint={toolbarHint} />

      <CustomerTable
        customers={filteredCustomers}
        customerStats={customerStats}
        onEdit={onEdit}
        onDelete={onDelete}
        emptyMessage={emptyMessage}
      />

      <CustomerCardList
        customers={filteredCustomers}
        customerStats={customerStats}
        onEdit={onEdit}
        onDelete={onDelete}
        emptyMessage={emptyMessage}
      />
    </Card>
  );
};

export default CustomerList;

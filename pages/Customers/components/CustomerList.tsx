import React, { useState, useMemo } from 'react';
import { Customer } from '@/types';
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

  return (
    <Card
      padding="none"
      layoutClassName="flex h-full flex-col overflow-hidden animate-fade-in"
      borderClassName="border border-slate-100 dark:border-slate-700"
      backgroundClassName="bg-white dark:bg-slate-800"
      roundedClassName="rounded-xl"
      shadowClassName="shadow-sm"
      stateClassName="transition-colors"
    >
      <CustomerFilters searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      <CustomerTable
        customers={filteredCustomers}
        customerStats={customerStats}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      <CustomerCardList
        customers={filteredCustomers}
        customerStats={customerStats}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </Card>
  );
};

export default CustomerList;

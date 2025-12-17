import React, { useState, useMemo } from 'react';
import { Customer } from '@/types';
import CustomerFilters from './CustomerFilters';
import CustomerTable from './desktop/CustomerTable';
import CustomerCardList from './mobile/CustomerCardList';

interface CustomerListProps {
  customers: Customer[];
  customerStats: Map<string, number>;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
}

const CustomerList: React.FC<CustomerListProps> = ({ customers, customerStats, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full animate-fade-in transition-colors overflow-hidden">
      <CustomerFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

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
    </div>
  );
};

export default CustomerList;

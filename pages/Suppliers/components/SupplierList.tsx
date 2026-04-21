import React, { useState, useMemo } from 'react';
import { Supplier } from '@/types';
import SupplierFilters from './SupplierFilters';
import SupplierTable from './desktop/SupplierTable';
import SupplierCardList from './mobile/SupplierCardList';
import Card from '@/components/ui/Card';

interface SupplierListProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (id: string) => void;
}

const SupplierList: React.FC<SupplierListProps> = ({ suppliers, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSuppliers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return suppliers.filter((s) =>
      s.name.toLowerCase().includes(term) ||
      (s.phone || '').toLowerCase().includes(term) ||
      (s.email || '').toLowerCase().includes(term)
    );
  }, [suppliers, searchTerm]);

  return (
    <Card
      padding="none"
      layoutClassName="flex h-full animate-fade-in flex-col overflow-hidden"
      backgroundClassName="bg-white dark:bg-slate-800"
      borderClassName="border-slate-100 dark:border-slate-700"
      stateClassName="transition-colors"
    >
      <SupplierFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <SupplierTable
        suppliers={filteredSuppliers}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      <SupplierCardList
        suppliers={filteredSuppliers}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </Card>
  );
};

export default SupplierList;


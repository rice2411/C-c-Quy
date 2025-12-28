import React, { useState, useMemo } from 'react';
import { Supplier } from '@/types';
import SupplierFilters from './SupplierFilters';
import SupplierTable from './desktop/SupplierTable';
import SupplierCardList from './mobile/SupplierCardList';

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
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full animate-fade-in transition-colors overflow-hidden">
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
    </div>
  );
};

export default SupplierList;


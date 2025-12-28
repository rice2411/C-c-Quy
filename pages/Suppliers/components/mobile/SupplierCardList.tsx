import React from 'react';
import { Supplier } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import SupplierCard from './SupplierCard';

interface SupplierCardListProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (id: string) => void;
}

const SupplierCardList: React.FC<SupplierCardListProps> = ({ suppliers, onEdit, onDelete }) => {
  const { t } = useLanguage();

  return (
    <div className="lg:hidden p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50 flex-1 overflow-y-auto">
      {suppliers.length > 0 ? (
        suppliers.map((supplier) => (
          <SupplierCard
            key={supplier.id}
            supplier={supplier}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      ) : (
        <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">{t('suppliers.noData')}</div>
      )}
    </div>
  );
};

export default SupplierCardList;


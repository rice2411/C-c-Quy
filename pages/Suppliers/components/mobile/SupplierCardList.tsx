import React from 'react';
import { Supplier } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import SupplierCard from './SupplierCard';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';

interface SupplierCardListProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (id: string) => void;
}

const SupplierCardList: React.FC<SupplierCardListProps> = ({ suppliers, onEdit, onDelete }) => {
  const { t } = useLanguage();

  return (
    <Box
      layoutClassName="flex-1 space-y-4 overflow-y-auto p-4 lg:hidden"
      backgroundClassName="bg-slate-50/50 dark:bg-slate-900/50"
    >
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
        <Typography size="sm" variant="muted" layoutClassName="py-10 text-center">
          {t('suppliers.noData')}
        </Typography>
      )}
    </Box>
  );
};

export default SupplierCardList;


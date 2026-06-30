import React, { useCallback, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useImportedSuppliers } from '@/hooks/queries/useStockReceiptQuery';
import Box from '@/components/ui/Box';
import BillImportSuppliersTab from '@/pages/StockReceipts/BillImportSuppliersTab';
import { normalizeSearchText } from '@/utils/format/stringUtil';

const SuppliersPage: React.FC = () => {
  const { t } = useLanguage();
  const [supplierSearch, setSupplierSearch] = useState('');

  const suppliersQuery = useImportedSuppliers();
  const supplierRows = suppliersQuery.suppliers;
  const masterLoading = suppliersQuery.loading;

  const loadSuppliers = useCallback(async () => {
    await suppliersQuery.refetch();
  }, [suppliersQuery]);

  const filteredSuppliers = supplierRows.filter((row) => {
    const q = normalizeSearchText(supplierSearch);
    if (!q) return true;
    return (
      normalizeSearchText(row.name).includes(q) ||
      normalizeSearchText(row.normalizedName).includes(q)
    );
  });

  return (
    <Box layoutClassName="space-y-6 animate-fade-in">
      <BillImportSuppliersTab
        supplierSearch={supplierSearch}
        onSupplierSearchChange={setSupplierSearch}
        masterLoading={masterLoading}
        onRefresh={loadSuppliers}
        filteredSuppliers={filteredSuppliers}
      />
    </Box>
  );
};

export default SuppliersPage;

import React, { useCallback, useState } from 'react';
import { Package } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useImportedMaterials } from '@/hooks/queries/useStockReceiptQuery';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import BillImportMaterialsTab from '@/pages/StockReceipts/BillImportMaterialsTab';
import { normalizeSearchText } from '@/utils/format/stringUtil';

const MaterialsPage: React.FC = () => {
  const { t } = useLanguage();
  const [materialSearch, setMaterialSearch] = useState('');

  const materialsQuery = useImportedMaterials();
  const materialRows = materialsQuery.materials;
  const masterLoading = materialsQuery.loading;

  const loadMaterials = useCallback(async () => {
    await materialsQuery.refetch();
  }, [materialsQuery]);

  const filteredMaterials = materialRows.filter((row) => {
    const q = normalizeSearchText(materialSearch);
    if (!q) return true;
    return (
      normalizeSearchText(row.name).includes(q) ||
      normalizeSearchText(row.normalizedName).includes(q)
    );
  });

  return (
    <Box layoutClassName="space-y-6 animate-fade-in">
      <Box>
        <Heading level={2} textClassName="flex items-center gap-2 text-xl font-semibold">
          <Package className="h-6 w-6 text-primary-500" />
          {t('header.materialsTitle')}
        </Heading>
      </Box>

      <BillImportMaterialsTab
        materialSearch={materialSearch}
        onMaterialSearchChange={setMaterialSearch}
        masterLoading={masterLoading}
        onRefresh={loadMaterials}
        filteredMaterials={filteredMaterials}
      />
    </Box>
  );
};

export default MaterialsPage;

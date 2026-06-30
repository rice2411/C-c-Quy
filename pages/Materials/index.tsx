import React, { useCallback, useState } from 'react';
import { ChevronUp, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useImportedMaterials } from '@/hooks/queries/useStockReceiptQuery';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import BillImportMaterialsTab from '@/pages/StockReceipts/BillImportMaterialsTab';
import { normalizeSearchText } from '@/utils/format/stringUtil';
import MergeSuggestionsPanel from './components/MergeSuggestionsPanel';

const MaterialsPage: React.FC = () => {
  const { t } = useLanguage();
  const [materialSearch, setMaterialSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

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
      <Box layoutClassName="flex flex-wrap items-center justify-end gap-3">
        <Button
          type="button"
          variant={showSuggestions ? 'secondary' : 'primary'}
          onClick={() => setShowSuggestions((v) => !v)}
          leftIcon={
            showSuggestions ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )
          }
          iconClassName="inline-flex shrink-0"
          layoutClassName="inline-flex items-center gap-2"
          roundedClassName="rounded-xl"
        >
          {showSuggestions
            ? t('billImport.materialsMerge.hideSuggestions')
            : t('billImport.materialsMerge.showSuggestions')}
        </Button>
      </Box>

      <MergeSuggestionsPanel open={showSuggestions} onMerged={loadMaterials} />

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

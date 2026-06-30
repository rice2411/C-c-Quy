import React, { useCallback, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useImportedMaterials } from '@/hooks/queries/useStockReceiptQuery';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import BillImportMaterialsTab from '@/pages/StockReceipts/BillImportMaterialsTab';
import BillImportModal from '@/pages/StockReceipts/BillImportModal';
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

  // Nút "Gợi ý gộp" đặt trong toolbar actions (giống nút action ở Products) → mở modal.
  const suggestionsToggle = (
    <Button
      type="button"
      onClick={() => setShowSuggestions(true)}
      leftIcon={<Sparkles className="h-3.5 w-3.5" />}
      iconClassName="inline-flex shrink-0 [&_svg]:h-3.5 [&_svg]:w-3.5"
      sizeClassName="px-3 py-2 text-xs"
      backgroundClassName="bg-white dark:bg-slate-800"
      borderClassName="border border-slate-200 dark:border-slate-600"
      textClassName="font-medium text-slate-700 dark:text-slate-200"
      roundedClassName="rounded-xl"
      layoutClassName="inline-flex items-center gap-1.5"
      disableVariantHover
      disableVariantTextColor
    >
      {t('billImport.materialsMerge.showSuggestions')}
    </Button>
  );

  return (
    <Box layoutClassName="space-y-6 animate-fade-in">
      <BillImportMaterialsTab
        materialSearch={materialSearch}
        onMaterialSearchChange={setMaterialSearch}
        masterLoading={masterLoading}
        onRefresh={loadMaterials}
        filteredMaterials={filteredMaterials}
        extraActions={suggestionsToggle}
      />

      <BillImportModal
        open={showSuggestions}
        onClose={() => setShowSuggestions(false)}
        title={t('billImport.materialsMerge.suggestTitle')}
      >
        <MergeSuggestionsPanel open={showSuggestions} embedded onMerged={loadMaterials} />
      </BillImportModal>
    </Box>
  );
};

export default MaterialsPage;

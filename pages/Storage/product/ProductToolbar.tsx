import React from 'react';
import { Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import FilterToolbar from '@/components/shared/FilterToolbar';

interface ProductToolbarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onCreate: () => void;
}

const ProductToolbar: React.FC<ProductToolbarProps> = ({ searchTerm, onSearchChange, onCreate }) => {
  const { t } = useLanguage();

  return (
    <Box layoutClassName="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-start">
      <Box layoutClassName="flex-1 min-w-0">
        <FilterToolbar
          search={searchTerm}
          onSearchChange={onSearchChange}
          searchPlaceholder={t('inventory.searchPlaceholder')}
        />
      </Box>

      <Button
        type="button"
        onClick={onCreate}
        leftIcon={<Plus />}
        iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
        sizeClassName="px-4 py-2"
        layoutClassName="whitespace-nowrap gap-2 sm:self-start"
        backgroundClassName="bg-orange-600"
        hoverClassName="hover:bg-orange-700"
        textClassName="text-sm font-medium text-white"
        roundedClassName="rounded-lg"
        shadowClassName="shadow-sm shadow-orange-200 dark:shadow-none"
        stateClassName="transition-colors"
        disableVariantHover
        disableVariantTextColor
      >
        {t('inventory.addProduct')}
      </Button>
    </Box>
  );
};

export default ProductToolbar;

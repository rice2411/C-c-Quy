import React from 'react';
import { Plus, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface IngredientToolbarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onCreate: () => void;
}

const IngredientToolbar: React.FC<IngredientToolbarProps> = ({ 
  searchTerm, 
  onSearchChange, 
  onCreate
}) => {
  const { t } = useLanguage();

  return (
    <Box layoutClassName="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <Box layoutClassName="relative w-full sm:w-72">
        <Input
          type="text"
          placeholder={t('ingredients.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          leftIcon={<Search />}
          leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
          backgroundClassName="bg-white dark:bg-slate-800"
          borderClassName="border-slate-200 dark:border-slate-700"
          shadowClassName="shadow-sm"
        />
      </Box>

      <Button
        type="button"
        onClick={onCreate}
        leftIcon={<Plus />}
        iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
        sizeClassName="px-4 py-2"
        layoutClassName="whitespace-nowrap gap-2"
        backgroundClassName="bg-orange-600"
        hoverClassName="hover:bg-orange-700"
        textClassName="text-sm font-medium text-white"
        roundedClassName="rounded-lg"
        shadowClassName="shadow-sm shadow-orange-200 dark:shadow-none"
        stateClassName="transition-colors"
        disableVariantHover
        disableVariantTextColor
      >
        {t('ingredients.add')}
      </Button>
    </Box>
  );
};

export default IngredientToolbar;


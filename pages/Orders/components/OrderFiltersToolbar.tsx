import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Filter, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';

interface OrderFiltersToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onOpenAdvanced: () => void;
}

const OrderFiltersToolbar: React.FC<OrderFiltersToolbarProps> = ({
  searchTerm,
  onSearchChange,
  onOpenAdvanced
}) => {
  const { t } = useLanguage();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  return (
    <Box
      layoutClassName="flex shrink-0 flex-col gap-4 p-5"
      borderClassName="border-b border-slate-100 dark:border-slate-700"
    >
      <Box layoutClassName="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <Box layoutClassName="flex w-full items-center justify-between sm:w-auto">
          <Heading level={2} layoutClassName="flex items-center gap-2" textClassName="text-lg font-semibold">
            <Filter className="h-5 w-5 text-orange-500" />
            {t('orders.recent')}
          </Heading>
          <IconButton
            type="button"
            label="Toggle filters"
            variant="ghost"
            layoutClassName="sm:hidden"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            {isFiltersOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </IconButton>
        </Box>

        <Box layoutClassName="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <Box layoutClassName="relative w-full sm:w-64">
            <Input
              type="text"
              placeholder={t('orders.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              leftIcon={<Search />}
              leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
            />
          </Box>
          <Button
            type="button"
            onClick={onOpenAdvanced}
            variant="secondary"
            disableVariantHover
            disableVariantTextColor
            borderClassName="border border-slate-200 dark:border-slate-600"
            backgroundClassName="bg-white dark:bg-slate-800"
            hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700"
            textClassName="text-sm font-medium text-slate-700 dark:text-slate-200"
            roundedClassName="rounded-lg"
            sizeClassName="px-3 py-2"
            layoutClassName="inline-flex w-full items-center justify-center gap-2 sm:w-auto"
            stateClassName="transition-colors"
          >
            {t('orders.filters') ?? 'Filters'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default OrderFiltersToolbar;

import React from 'react';
import { Search, Building2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Input from '@/components/ui/Input';

interface SupplierFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const SupplierFilters: React.FC<SupplierFiltersProps> = ({ searchTerm, onSearchChange }) => {
  const { t } = useLanguage();

  return (
    <Box
      layoutClassName="flex items-center justify-between gap-4 p-5"
      borderClassName="border-b border-slate-100 dark:border-slate-700"
    >
      <Heading level={2} layoutClassName="flex items-center gap-2" textClassName="text-lg font-semibold text-slate-800 dark:text-white">
        <Building2 className="h-5 w-5 text-orange-500" />
        {t('suppliers.title')}
      </Heading>
      
      <Box layoutClassName="relative w-full max-w-md">
        <Input
          type="text" 
          placeholder={t('suppliers.search')}
          leftIcon={<Search />}
          leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
          backgroundClassName="bg-slate-50 dark:bg-slate-700"
          borderClassName="border-slate-200 dark:border-slate-600"
          textClassName="placeholder-slate-400"
          stateClassName="transition-all"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </Box>
    </Box>
  );
};

export default SupplierFilters;


import React from 'react';
import { Search, User } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Input from '@/components/ui/Input';

interface CustomerFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const CustomerFilters: React.FC<CustomerFiltersProps> = ({ searchTerm, onSearchChange }) => {
  const { t } = useLanguage();

  return (
    <Box
      layoutClassName="flex items-center justify-between gap-4 p-5"
      borderClassName="border-b border-slate-100 dark:border-slate-700"
    >
      <Heading level={2} layoutClassName="flex items-center gap-2" textClassName="text-lg font-semibold text-slate-800 dark:text-white">
        <User className="h-5 w-5 text-orange-500" />
        {t('customers.title')}
      </Heading>

      <Box layoutClassName="relative w-full max-w-md">
        <Input
          type="text"
          placeholder={t('customers.search')}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </Box>
    </Box>
  );
};

export default CustomerFilters;

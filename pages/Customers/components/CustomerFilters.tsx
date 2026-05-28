import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';
import FilterToolbar from '@/components/shared/FilterToolbar';

interface CustomerFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  toolbarHint: string;
}

const CustomerFilters: React.FC<CustomerFiltersProps> = ({ searchTerm, onSearchChange, toolbarHint }) => {
  const { t } = useLanguage();

  return (
    <Box
      layoutClassName="flex flex-col gap-3 border-b border-slate-100 p-4 sm:px-6 sm:py-5 dark:border-slate-700/80"
      backgroundClassName="bg-slate-50/50 dark:bg-slate-900/25"
    >
      <FilterToolbar
        search={searchTerm}
        onSearchChange={onSearchChange}
        searchPlaceholder={t('customers.search')}
        stats={
          <Typography size="xs" variant="muted" layoutClassName="shrink-0 tabular-nums sm:text-right">
            {toolbarHint}
          </Typography>
        }
      />
    </Box>
  );
};

export default CustomerFilters;

import React from 'react';
import { Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Box from '@/components/ui/Box';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';

interface CustomerFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  toolbarHint: string;
}

const CustomerFilters: React.FC<CustomerFiltersProps> = ({ searchTerm, onSearchChange, toolbarHint }) => {
  const { t } = useLanguage();

  return (
    <Box
      layoutClassName="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-5 dark:border-slate-700/80"
      backgroundClassName="bg-slate-50/50 dark:bg-slate-900/25"
    >
      <Box layoutClassName="min-w-0 flex-1 sm:max-w-md">
        <Input
          type="search"
          placeholder={t('customers.search')}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          leftIcon={<Search className="h-4 w-4 text-slate-400" />}
        />
      </Box>
      <Typography size="xs" variant="muted" layoutClassName="shrink-0 tabular-nums sm:text-right">
        {toolbarHint}
      </Typography>
    </Box>
  );
};

export default CustomerFilters;

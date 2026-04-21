import React from 'react';
import { Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Box from '@/components/ui/Box';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { UserStatus } from '@/types/user';

interface UserFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: UserStatus | 'all';
  onStatusFilterChange: (value: UserStatus | 'all') => void;
}

const UserFilters: React.FC<UserFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange
}) => {
  const { t } = useLanguage();

  return (
    <Box layoutClassName="flex flex-col gap-4 sm:flex-row">
      <Box layoutClassName="flex-1">
        <Input
          type="text" 
          placeholder={t('users.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          leftIcon={<Search />}
          leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
          backgroundClassName="bg-white dark:bg-slate-800"
          borderClassName="border-slate-200 dark:border-slate-700"
          shadowClassName="shadow-sm"
        />
      </Box>
      <Select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value as UserStatus | 'all')}
        backgroundClassName="bg-white dark:bg-slate-800"
        borderClassName="border-slate-200 dark:border-slate-700"
        shadowClassName="shadow-sm"
      >
        <option value="all">{t('users.filter.all')}</option>
        <option value="pending">{t('users.status.pending')}</option>
        <option value="active">{t('users.status.active')}</option>
        <option value="inactive">{t('users.status.inactive')}</option>
      </Select>
    </Box>
  );
};

export default UserFilters;


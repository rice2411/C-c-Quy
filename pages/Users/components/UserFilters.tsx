import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserStatus } from '@/types/user';
import FilterToolbar from '@/components/shared/FilterToolbar';
import FilterPill from '@/components/shared/FilterPill';

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
  onStatusFilterChange,
}) => {
  const { t } = useLanguage();

  return (
    <FilterToolbar
      search={searchTerm}
      onSearchChange={onSearchChange}
      searchPlaceholder={t('users.searchPlaceholder')}
      customFilters={
        <FilterPill
          label={t('users.filter.statusLabel') || 'Trạng thái'}
          value={statusFilter}
          onChange={(v) => onStatusFilterChange(v as UserStatus | 'all')}
          options={[
            { value: 'all', label: t('users.filter.all') },
            { value: 'pending', label: t('users.status.pending') },
            { value: 'active', label: t('users.status.active') },
            { value: 'inactive', label: t('users.status.inactive') },
          ]}
        />
      }
    />
  );
};

export default UserFilters;

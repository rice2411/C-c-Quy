import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Box from '@/components/ui/Box';
import { MetricCard } from '@/components/ui/stats';

interface UserStatsProps {
  total: number;
  pending: number;
  active: number;
  inactive: number;
}

const UserStats: React.FC<UserStatsProps> = ({ total, pending, active, inactive }) => {
  const { t } = useLanguage();
  const stats = [
    { label: t('users.stats.total'), value: total, valueClassName: 'text-slate-900 dark:text-white' },
    { label: t('users.stats.pending'), value: pending, valueClassName: 'text-yellow-600 dark:text-yellow-400' },
    { label: t('users.stats.active'), value: active, valueClassName: 'text-emerald-600 dark:text-emerald-400' },
    { label: t('users.stats.inactive'), value: inactive, valueClassName: 'text-red-600 dark:text-red-400' },
  ];

  return (
    <Box layoutClassName="grid grid-cols-1 gap-4 md:grid-cols-4">
      {stats.map((item) => (
        <MetricCard key={item.label} label={item.label} value={item.value} valueClassName={item.valueClassName} padding="sm" />
      ))}
    </Box>
  );
};

export default UserStats;


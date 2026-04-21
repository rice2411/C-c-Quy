import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';

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
        <Card
          key={item.label}
          layoutClassName="p-4"
          backgroundClassName="bg-white dark:bg-slate-800"
          borderClassName="border-slate-100 dark:border-slate-700"
        >
          <Typography size="sm" layoutClassName="font-medium" textClassName="text-slate-500 dark:text-slate-400">
            {item.label}
          </Typography>
          <Heading
            level={3}
            layoutClassName="mt-1 text-2xl"
            textClassName={item.valueClassName}
          >
            {item.value}
          </Heading>
        </Card>
      ))}
    </Box>
  );
};

export default UserStats;


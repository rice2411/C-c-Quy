import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserStatsProps {
  total: number;
  pending: number;
  active: number;
  inactive: number;
}

const UserStats: React.FC<UserStatsProps> = ({ total, pending, active, inactive }) => {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('users.stats.total')}</p>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{total}</h3>
      </div>
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('users.stats.pending')}</p>
        <h3 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{pending}</h3>
      </div>
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('users.stats.active')}</p>
        <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{active}</h3>
      </div>
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('users.stats.inactive')}</p>
        <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{inactive}</h3>
      </div>
    </div>
  );
};

export default UserStats;


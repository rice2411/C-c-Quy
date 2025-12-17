import React from 'react';
import { CheckCircle, XCircle, Clock, Shield } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserStatus, UserRole } from '@/types/user';

export const StatusBadge: React.FC<{ status: UserStatus }> = ({ status }) => {
  const { t } = useLanguage();
  
  const badges = {
    pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', label: t('users.status.pending') },
    active: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400', label: t('users.status.active') },
    inactive: { icon: XCircle, color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', label: t('users.status.inactive') }
  };
  
  const badge = badges[status];
  const Icon = badge.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
      <Icon className="w-3 h-3" />
      {badge.label}
    </span>
  );
};

export const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  const { t } = useLanguage();
  
  const badges = {
    super_admin: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400', label: t('users.role.superAdmin') },
    admin: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', label: t('users.role.admin') },
    colaborator: { color: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300', label: t('users.role.colaborator') }
  };
  
  const badge = badges[role];
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
      <Shield className="w-3 h-3" />
      {badge.label}
    </span>
  );
};


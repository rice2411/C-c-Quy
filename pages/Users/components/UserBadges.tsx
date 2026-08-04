import React from 'react';
import { CheckCircle, XCircle, Clock, Shield } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Badge from '@/components/ui/Badge';
import { UserStatus, UserRole } from '@/types/user';

export const StatusBadge: React.FC<{ status: UserStatus }> = ({ status }) => {
  const { t } = useLanguage();
  
  const badges = {
    pending: { icon: Clock, background: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-800 dark:text-yellow-400', label: t('users.status.pending') },
    active: { icon: CheckCircle, background: 'bg-emerald-100 dark:bg-emerald-900/20', text: 'text-emerald-800 dark:text-emerald-400', label: t('users.status.active') },
    inactive: { icon: XCircle, background: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-800 dark:text-red-400', label: t('users.status.inactive') }
  };
  
  const badge = badges[status];
  const Icon = badge.icon;
  
  return (
    <Badge
      size="sm"
      layoutClassName="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium"
      roundedClassName="rounded-full"
      borderClassName="border-transparent"
      backgroundClassName={badge.background}
      textClassName={badge.text}
    >
      <Icon className="w-3 h-3" />
      {badge.label}
    </Badge>
  );
};

export const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  const { t } = useLanguage();
  
  const badges: Record<UserRole, { background: string; text: string; label: string }> = {
    super_admin: { background: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-800 dark:text-purple-400', label: t('users.role.superAdmin') },
    admin: { background: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-800 dark:text-blue-400', label: t('users.role.admin') },
    colaborator: { background: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-800 dark:text-slate-300', label: t('users.role.colaborator') },
    staff: { background: 'bg-teal-100 dark:bg-teal-900/20', text: 'text-teal-800 dark:text-teal-400', label: t('users.role.staff') },
  };

  // Fallback an toàn nếu role lạ (tránh crash trang như bug role 'staff' trước đây).
  const badge = badges[role] ?? badges.colaborator;
  
  return (
    <Badge
      size="sm"
      layoutClassName="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium"
      roundedClassName="rounded-full"
      borderClassName="border-transparent"
      backgroundClassName={badge.background}
      textClassName={badge.text}
    >
      <Shield className="w-3 h-3" />
      {badge.label}
    </Badge>
  );
};


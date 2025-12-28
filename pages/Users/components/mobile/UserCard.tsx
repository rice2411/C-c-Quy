import React from 'react';
import { CheckCircle, XCircle, Edit2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserData, UserStatus, UserRole } from '@/types/user';
import { StatusBadge, RoleBadge } from '@/pages/Users/components/UserBadges';

interface UserCardProps {
  user: UserData;
  editingUser: UserData | null;
  editingRoleUser: UserData | null;
  customName: string;
  selectedRole: UserRole;
  onEditCustomName: (user: UserData) => void;
  onSaveCustomName: () => void;
  onCancelEditCustomName: () => void;
  onCustomNameChange: (value: string) => void;
  onEditRole: (user: UserData) => void;
  onSaveRole: () => void;
  onCancelEditRole: () => void;
  onRoleChange: (role: UserRole) => void;
  onStatusChange: (uid: string, status: UserStatus) => void;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  editingUser,
  editingRoleUser,
  customName,
  selectedRole,
  onEditCustomName,
  onSaveCustomName,
  onCancelEditCustomName,
  onCustomNameChange,
  onEditRole,
  onSaveRole,
  onCancelEditRole,
  onRoleChange,
  onStatusChange
}) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
      {/* User Header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
        <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-slate-600 overflow-hidden border border-slate-200 dark:border-slate-500 flex items-center justify-center flex-shrink-0">
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || 'User'} 
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-orange-600 dark:text-orange-400 font-bold text-base">
              {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 dark:text-white truncate">
            {user.displayName || t('users.table.user')}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {user.email}
          </p>
        </div>
      </div>

      {/* Custom Name */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
            {t('users.table.customName')}
          </span>
        </div>
        {editingUser?.uid === user.uid ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customName}
              onChange={(e) => onCustomNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveCustomName();
                if (e.key === 'Escape') onCancelEditCustomName();
              }}
              className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              autoFocus
            />
            <button
              onClick={onSaveCustomName}
              className="text-emerald-600 hover:text-emerald-700"
            >
              <CheckCircle className="w-5 h-5" />
            </button>
            <button
              onClick={onCancelEditCustomName}
              className="text-red-600 hover:text-red-700"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-300">
              {user.customName || '-'}
            </span>
            <button
              onClick={() => onEditCustomName(user)}
              className="text-slate-400 hover:text-orange-600 dark:hover:text-orange-400"
              title={t('users.table.customName')}
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Role */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
            {t('users.table.role')}
          </span>
        </div>
        {editingRoleUser?.uid === user.uid ? (
          <div className="flex items-center gap-2">
            <select
              value={selectedRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              autoFocus
            >
              <option value={UserRole.ADMIN}>{t('users.role.admin')}</option>
              <option value={UserRole.COLABORATOR}>{t('users.role.colaborator')}</option>
            </select>
            <button
              onClick={onSaveRole}
              className="text-emerald-600 hover:text-emerald-700"
            >
              <CheckCircle className="w-5 h-5" />
            </button>
            <button
              onClick={onCancelEditRole}
              className="text-red-600 hover:text-red-700"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <RoleBadge role={user.role} />
            {user.role !== UserRole.SUPER_ADMIN && (
              <button
                onClick={() => onEditRole(user)}
                className="text-slate-400 hover:text-orange-600 dark:hover:text-orange-400"
                title={t('users.table.role')}
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Status */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
            {t('users.table.status')}
          </span>
        </div>
        <StatusBadge status={user.status} />
      </div>

      {/* Last Login */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
            {t('users.table.lastLogin')}
          </span>
        </div>
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('vi-VN') : '-'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
        {user.status === 'pending' && (
          <button
            onClick={() => onStatusChange(user.uid, UserStatus.ACTIVE)}
            className="flex-1 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
          >
            {t('users.actions.approve')}
          </button>
        )}
        {user.status === 'active' && (
          <button
            onClick={() => onStatusChange(user.uid, UserStatus.INACTIVE)}
            className="flex-1 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          >
            {t('users.actions.deactivate')}
          </button>
        )}
        {user.status === 'inactive' && (
          <button
            onClick={() => onStatusChange(user.uid, UserStatus.ACTIVE)}
            className="flex-1 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
          >
            {t('users.actions.activate')}
          </button>
        )}
      </div>
    </div>
  );
};

export default UserCard;


import React from 'react';
import { CheckCircle, XCircle, Edit2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserData, UserStatus, UserRole } from '@/types/user';
import { StatusBadge, RoleBadge } from '@/pages/Users/components/UserBadges';

interface UserTableProps {
  users: UserData[];
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

const UserTable: React.FC<UserTableProps> = ({
  users,
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
    <div className="hidden lg:block bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex-1">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
            <tr>
              <th className="px-6 py-3 font-medium">{t('users.table.user')}</th>
              <th className="px-6 py-3 font-medium">{t('users.table.customName')}</th>
              <th className="px-6 py-3 font-medium">{t('users.table.role')}</th>
              <th className="px-6 py-3 font-medium">{t('users.table.status')}</th>
              <th className="px-6 py-3 font-medium hidden md:table-cell">{t('users.table.lastLogin')}</th>
              <th className="px-6 py-3 font-medium text-right">{t('users.table.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {users.map((user) => (
              <tr key={user.uid} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-slate-600 overflow-hidden border border-slate-200 dark:border-slate-500 flex items-center justify-center flex-shrink-0">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt={user.displayName || 'User'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">
                          {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white truncate">
                        {user.displayName || t('users.table.user')}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
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
                        className="px-2 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        autoFocus
                      />
                      <button
                        onClick={onSaveCustomName}
                        className="text-emerald-600 hover:text-emerald-700"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={onCancelEditCustomName}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <span className="text-slate-600 dark:text-slate-300">
                        {user.customName || '-'}
                      </span>
                      <button
                        onClick={() => onEditCustomName(user)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-opacity"
                        title={t('users.table.customName')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingRoleUser?.uid === user.uid ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedRole}
                        onChange={(e) => onRoleChange(e.target.value as UserRole)}
                        className="px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        autoFocus
                      >
                        <option value={UserRole.ADMIN}>{t('users.role.admin')}</option>
                        <option value={UserRole.COLABORATOR}>{t('users.role.colaborator')}</option>
                      </select>
                      <button
                        onClick={onSaveRole}
                        className="text-emerald-600 hover:text-emerald-700"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={onCancelEditRole}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <RoleBadge role={user.role} />
                      {user.role !== UserRole.SUPER_ADMIN && (
                        <button
                          onClick={() => onEditRole(user)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 transition-opacity"
                          title={t('users.table.role')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={user.status} />
                </td>
                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 hidden md:table-cell">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('vi-VN') : '-'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {user.status === 'pending' && (
                      <button
                        onClick={() => onStatusChange(user.uid, UserStatus.ACTIVE)}
                        className="px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                      >
                        {t('users.actions.approve')}
                      </button>
                    )}
                    {user.status === 'active' && (
                      <button
                        onClick={() => onStatusChange(user.uid, UserStatus.INACTIVE)}
                        className="px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        {t('users.actions.deactivate')}
                      </button>
                    )}
                    {user.status === 'inactive' && (
                      <button
                        onClick={() => onStatusChange(user.uid, UserStatus.ACTIVE)}
                        className="px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                      >
                        {t('users.actions.activate')}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;


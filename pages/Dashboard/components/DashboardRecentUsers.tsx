import React, { useEffect, useMemo, useState } from 'react';
import { Clock, User } from 'lucide-react';
import { UserData } from '@/types/user';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllUsers } from '@/services/userService';

const DashboardRecentUsers: React.FC = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserData[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch (e) {
        console.error('Error loading recent users for dashboard:', e);
      }
    };
    load();
  }, []);

  const recentUsers = useMemo(
    () =>
      [...users]
        .filter((u) => u.lastLoginAt)
        .sort(
          (a, b) =>
            new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime()
        )
        .slice(0, 5),
    [users]
  );

  if (recentUsers.length === 0) return null;

  const formatDate = (value: string) => {
    try {
      return new Date(value).toLocaleString(
        t('language') === 'vi' ? 'vi-VN' : 'en-US'
      );
    } catch {
      return value;
    }
  };

  const getInitials = (user: UserData) => {
    const name = user.customName || user.displayName || user.email || '';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0).toUpperCase() +
      parts[parts.length - 1].charAt(0).toUpperCase()
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-500" />
          {t('dashboard.recentUsers') || 'Recent logins'}
        </h3>
      </div>
      <div className="space-y-2">
        {recentUsers.map((user) => (
          <div
            key={user.uid}
            className="flex items-center justify-between gap-3 px-2.5 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || user.email || 'avatar'}
                  className="w-9 h-9 rounded-full object-cover border border-indigo-200 dark:border-indigo-700 flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-300 text-xs font-semibold flex-shrink-0">
                  {getInitials(user)}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {user.customName || user.displayName || user.email || 'User'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {formatDate(user.lastLoginAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardRecentUsers;



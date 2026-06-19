import React, { useEffect, useMemo, useState } from 'react';
import { Clock, User } from 'lucide-react';
import AvatarImage from '@/components/ui/AvatarImage';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import { UserData } from '@/types/user';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAllUsers } from '@/services/userService';
import { parseDateValue, formatDateTime } from '@/utils/format/dateUtil';

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
            (parseDateValue(b.lastLoginAt)?.getTime() ?? 0) -
            (parseDateValue(a.lastLoginAt)?.getTime() ?? 0)
        )
        .slice(0, 5),
    [users]
  );

  if (recentUsers.length === 0) return null;

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
    <Card layoutClassName="p-4 sm:p-5">
      <Box layoutClassName="mb-4 flex items-center justify-between">
        <Heading level={3} layoutClassName="flex items-center gap-2" textClassName="text-sm font-semibold text-slate-800 dark:text-white">
          <User className="w-4 h-4 text-indigo-500" />
          {t('dashboard.recentUsers') || 'Recent logins'}
        </Heading>
      </Box>
      <Box layoutClassName="space-y-2">
        {recentUsers.map((user) => (
          <Box
            key={user.uid}
            layoutClassName="flex items-center justify-between gap-3 px-2.5 py-2.5"
            roundedClassName="rounded-lg"
            hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700/60"
            stateClassName="transition-colors"
          >
            <Box layoutClassName="flex min-w-0 items-center gap-3">
              <AvatarImage
                size="md"
                src={user.photoURL || undefined}
                alt={user.displayName || user.email || 'avatar'}
                referrerPolicy="no-referrer"
                containerClassName="border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30"
                fallback={
                  <Typography as="span" textClassName="text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                    {getInitials(user)}
                  </Typography>
                }
              />
              <Box layoutClassName="flex min-w-0 flex-col">
                <Typography layoutClassName="truncate" textClassName="text-xs font-semibold text-slate-800 dark:text-slate-100 sm:text-sm">
                  {user.customName || user.displayName || user.email || 'User'}
                </Typography>
                <Typography layoutClassName="truncate max-w-[200px]" textClassName="text-[11px] text-slate-500 dark:text-slate-400">
                  {user.email}
                </Typography>
              </Box>
            </Box>
            <Box layoutClassName="flex flex-shrink-0 items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <Typography as="span" textClassName="text-[11px] text-slate-500 dark:text-slate-400">
                {formatDateTime(user.lastLoginAt)}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Card>
  );
};

export default DashboardRecentUsers;

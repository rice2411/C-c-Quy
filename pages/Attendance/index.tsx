import React, { useMemo, useState } from 'react';
import { Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Tabs from '@/components/ui/Tabs';
import CheckInTab from './components/CheckInTab';
import ManageTab from './components/ManageTab';

const AttendancePage: React.FC = () => {
  const { userData } = useAuth();
  const isAdmin =
    userData?.role === UserRole.SUPER_ADMIN || userData?.role === UserRole.ADMIN;

  const [tab, setTab] = useState('check');

  const tabItems = useMemo(
    () => [
      { id: 'check', label: 'Chấm công' },
      ...(isAdmin ? [{ id: 'manage', label: 'Quản lý' }] : []),
    ],
    [isAdmin],
  );

  return (
    <Box layoutClassName="flex h-full flex-col gap-4 p-4 sm:p-6">
      <Box layoutClassName="flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary-500" />
        <Heading level={1} textClassName="text-lg font-bold text-slate-900 dark:text-white">
          Chấm công
        </Heading>
      </Box>

      {isAdmin && <Tabs items={tabItems} value={tab} onChange={setTab} />}

      <Box layoutClassName="flex-1 overflow-y-auto">
        {tab === 'manage' && isAdmin ? <ManageTab /> : <CheckInTab />}
      </Box>
    </Box>
  );
};

export default AttendancePage;

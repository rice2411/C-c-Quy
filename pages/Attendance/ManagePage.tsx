import React, { useState } from 'react';
import { UserCheck, ClipboardList, CalendarRange } from 'lucide-react';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import ManageTab from './components/ManageTab';
import AdminShiftBoard from './components/AdminShiftBoard';

type Tab = 'overview' | 'register';

/** Màn QUẢN LÝ CHẤM CÔNG (admin): tổng quan/IP/mặt/lịch sử + bảng quản lý đăng ký công. */
const AttendanceManagePage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('overview');

  const tabBtn = (value: Tab, label: string, icon: React.ReactNode) => (
    <Button
      type="button"
      onClick={() => setTab(value)}
      variant={tab === value ? 'primary' : 'secondary'}
      leftIcon={icon}
      iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
      sizeClassName="px-3.5 py-1.5 text-sm"
      roundedClassName="rounded-lg"
      borderClassName={tab === value ? 'border border-primary-600' : 'border border-slate-200 dark:border-slate-600'}
      backgroundClassName={tab === value ? 'bg-primary-600' : 'bg-white dark:bg-slate-800'}
      textClassName={tab === value ? 'font-medium text-white' : 'text-slate-700 dark:text-slate-200'}
      layoutClassName="inline-flex items-center gap-1.5"
      disableVariantHover
      disableVariantTextColor
    >
      {label}
    </Button>
  );

  return (
    <Box layoutClassName="flex h-full flex-col gap-4 p-4 sm:p-6">
      <Box layoutClassName="flex items-center gap-2">
        <UserCheck className="h-5 w-5 text-primary-500" />
        <Heading level={1} textClassName="text-lg font-bold text-slate-900 dark:text-white">
          Quản lý chấm công
        </Heading>
      </Box>

      <Box layoutClassName="flex flex-wrap gap-2">
        {tabBtn('overview', 'Tổng quan & lịch sử', <ClipboardList />)}
        {tabBtn('register', 'Đăng ký công', <CalendarRange />)}
      </Box>

      <Box layoutClassName="flex-1 overflow-y-auto">
        {tab === 'overview' ? <ManageTab /> : <AdminShiftBoard />}
      </Box>
    </Box>
  );
};

export default AttendanceManagePage;

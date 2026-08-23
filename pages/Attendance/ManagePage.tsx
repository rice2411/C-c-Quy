import React, { useState } from 'react';
import { Coins, BookUser, CalendarRange, Settings2 } from 'lucide-react';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import ManageTab from './components/ManageTab';
import AdminShiftBoard from './components/AdminShiftBoard';
import PayrollTab from './components/PayrollTab';
import TimesheetTab from './components/TimesheetTab';
import ShiftSettingsTab from '@/pages/WorkConfig/ShiftSettingsTab';
import { currentMonth } from './components/payrollUtil';

type Tab = 'timesheet' | 'payroll' | 'board' | 'settings';

/**
 * HUB Chấm công & Lương (admin) — gom hết vào 1 trang nhiều tab:
 *  - Sổ công: theo từng NV, xem đồng thời đăng ký ca + chấm công + công/giờ/lương, bổ sung tại chỗ.
 *  - Bảng lương: tổng mọi NV (công/giờ/lương) + xuất Excel; click NV → mở Sổ công.
 *  - Xếp ca: admin đăng ký/sửa ca cho NV theo tuần.
 *  - Cài đặt & lịch sử: mạng IP, khuôn mặt, tổng quan hôm nay, lịch sử chấm công.
 */
const AttendanceManagePage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('timesheet');
  const [month, setMonth] = useState<string>(currentMonth());
  const [employeeId, setEmployeeId] = useState<string>('');

  const pickEmployee = (id: string) => {
    setEmployeeId(id);
    setTab('timesheet');
  };

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
        <Coins className="h-5 w-5 text-primary-500" />
        <Heading level={1} textClassName="text-lg font-bold text-slate-900 dark:text-white">
          Chấm công & lương
        </Heading>
      </Box>

      <Box layoutClassName="flex flex-wrap gap-2">
        {tabBtn('timesheet', 'Sổ công', <BookUser />)}
        {tabBtn('payroll', 'Bảng lương', <Coins />)}
        {tabBtn('board', 'Xếp ca', <CalendarRange />)}
        {tabBtn('settings', 'Cài đặt & lịch sử', <Settings2 />)}
      </Box>

      <Box layoutClassName="flex-1 overflow-y-auto">
        {tab === 'timesheet' && (
          <TimesheetTab month={month} onMonthChange={setMonth} employeeId={employeeId} onEmployeeChange={setEmployeeId} />
        )}
        {tab === 'payroll' && (
          <PayrollTab month={month} onMonthChange={setMonth} onPickEmployee={pickEmployee} />
        )}
        {tab === 'board' && <AdminShiftBoard />}
        {tab === 'settings' && (
          <Box layoutClassName="flex flex-col gap-6">
            <ShiftSettingsTab />
            <ManageTab />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AttendanceManagePage;

import React, { useState } from 'react';
import { Coins, BookUser, Settings2 } from 'lucide-react';
import Box from '@/components/ui/Box';
import PageContainer from '@/components/ui/PageContainer';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import ManageTab from './components/ManageTab';
import TimesheetTab from './components/TimesheetTab';
import { currentMonth } from './components/payrollUtil';

type Tab = 'timesheet' | 'settings';

/**
 * HUB Chấm công & Lương (admin) — 2 tab:
 *  - Sổ công & lương: danh sách MỌI NV theo tháng (công/giờ/lương), bung chi tiết từng ngày
 *    (đăng ký ca + chấm công), bổ sung công tại chỗ, xuất Excel.
 *  - Tổng quan & lịch sử: khuôn mặt, tổng quan hôm nay, lịch sử chấm công.
 *  (Định nghĩa ca + Xếp ca thuộc nhóm "Ca làm", trang riêng.)
 */
const AttendanceManagePage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('timesheet');
  const [month, setMonth] = useState<string>(currentMonth());

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
    <PageContainer>
      <Box layoutClassName="flex items-center gap-2">
        <Coins className="h-5 w-5 text-primary-500" />
        <Heading level={1} textClassName="text-lg font-bold text-slate-900 dark:text-white">
          Chấm công & lương
        </Heading>
      </Box>

      <Box layoutClassName="flex flex-wrap gap-2">
        {tabBtn('timesheet', 'Sổ công & lương', <BookUser />)}
        {tabBtn('settings', 'Tổng quan & lịch sử', <Settings2 />)}
      </Box>

      <Box layoutClassName="flex-1 overflow-y-auto">
        {tab === 'timesheet' && <TimesheetTab month={month} onMonthChange={setMonth} />}
        {tab === 'settings' && <ManageTab />}
      </Box>
    </PageContainer>
  );
};

export default AttendanceManagePage;

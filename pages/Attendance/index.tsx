import React, { useState } from 'react';
import { Clock, Fingerprint, CalendarCheck } from 'lucide-react';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Heading from '@/components/ui/Heading';
import CheckInTab from './components/CheckInTab';
import RegisterTab from './components/RegisterTab';

type Tab = 'check' | 'register';

/** Màn CHẤM CÔNG cho NV: Chấm công (Face ID) + Đăng ký ca (đăng ký công tuần sau). */
const AttendancePage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('check');

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
        <Clock className="h-5 w-5 text-primary-500" />
        <Heading level={1} textClassName="text-lg font-bold text-slate-900 dark:text-white">
          Chấm công
        </Heading>
      </Box>

      <Box layoutClassName="flex gap-2">
        {tabBtn('check', 'Chấm công', <Fingerprint />)}
        {tabBtn('register', 'Đăng ký ca', <CalendarCheck />)}
      </Box>

      <Box layoutClassName="flex-1 overflow-y-auto">
        {tab === 'check' ? <CheckInTab /> : <RegisterTab />}
      </Box>
    </Box>
  );
};

export default AttendancePage;

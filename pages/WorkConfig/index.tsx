import React, { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Tabs from '@/components/ui/Tabs';
import ShiftSettingsTab from './ShiftSettingsTab';
import WageRatesTab from './WageRatesTab';
import CalendarView from '@/pages/Calendar';

type TabId = 'shift' | 'wage' | 'calendar';

/** Quản lý Công & ca — 1 trang: cài đặt ca, mức lương giờ, lịch đăng ký ca. */
const WorkConfigPage: React.FC = () => {
  const [tab, setTab] = useState<TabId>('shift');

  return (
    <Box layoutClassName="flex h-full flex-col gap-4 p-4 sm:p-6">
      <Box layoutClassName="flex items-center gap-2">
        <SlidersHorizontal className="h-5 w-5 text-primary-500" />
        <Heading level={1} textClassName="text-lg font-bold text-slate-900 dark:text-white">
          Công &amp; ca
        </Heading>
      </Box>

      <Tabs
        items={[
          { id: 'shift', label: 'Ca làm' },
          { id: 'wage', label: 'Mức lương giờ' },
          { id: 'calendar', label: 'Lịch' },
        ]}
        value={tab}
        onChange={(v) => setTab(v as TabId)}
      />

      <Box layoutClassName="min-h-0 flex-1 overflow-y-auto">
        {tab === 'shift' ? <ShiftSettingsTab /> : tab === 'wage' ? <WageRatesTab /> : <CalendarView />}
      </Box>
    </Box>
  );
};

export default WorkConfigPage;

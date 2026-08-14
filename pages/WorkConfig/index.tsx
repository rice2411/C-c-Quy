import React, { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Tabs from '@/components/ui/Tabs';
import ShiftSettingsTab from './ShiftSettingsTab';
import WageRatesTab from './WageRatesTab';

type TabId = 'shift' | 'wage';

/** Cấu hình Ca & Lương — 1 trang, 2 tab liên hệ nhau (ca = giờ, lương = đơn giá/giờ). */
const WorkConfigPage: React.FC = () => {
  const [tab, setTab] = useState<TabId>('shift');

  return (
    <Box layoutClassName="flex h-full flex-col gap-4 p-4 sm:p-6">
      <Box layoutClassName="flex items-center gap-2">
        <SlidersHorizontal className="h-5 w-5 text-primary-500" />
        <Heading level={1} textClassName="text-lg font-bold text-slate-900 dark:text-white">
          Ca &amp; lương
        </Heading>
      </Box>

      <Tabs
        items={[
          { id: 'shift', label: 'Ca làm' },
          { id: 'wage', label: 'Mức lương giờ' },
        ]}
        value={tab}
        onChange={(v) => setTab(v as TabId)}
      />

      <Box layoutClassName="min-h-0 flex-1 overflow-y-auto">
        {tab === 'shift' ? <ShiftSettingsTab /> : <WageRatesTab />}
      </Box>
    </Box>
  );
};

export default WorkConfigPage;

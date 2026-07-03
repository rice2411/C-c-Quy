import React, { useState } from 'react';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import Tabs from '@/components/ui/Tabs';
import ScheduleTab from './components/ScheduleTab';
import ManualSendTab from './components/ManualSendTab';

type TabKey = 'schedule' | 'manual';

const TAB_ITEMS = [
  { id: 'schedule', label: 'Lịch tự động' },
  { id: 'manual', label: 'Gửi ngay' },
];

const NotificationsPage: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('schedule');

  return (
    <Box layoutClassName="space-y-5 p-4">
      <Box>
        <Heading level={2}>Thông báo Zalo</Heading>
        <Typography variant="muted" size="sm">
          Lịch tự động gửi tin lặp lại (tổng kết, sản xuất) + gửi ngay các tin tuỳ chọn.
        </Typography>
      </Box>

      <Tabs items={TAB_ITEMS} value={tab} onChange={(v) => setTab(v as TabKey)} />

      {tab === 'schedule' && <ScheduleTab />}
      {tab === 'manual' && <ManualSendTab />}
    </Box>
  );
};

export default NotificationsPage;

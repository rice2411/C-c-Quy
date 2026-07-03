import React, { useState } from 'react';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import Tabs from '@/components/ui/Tabs';
import ScheduleTab from './components/ScheduleTab';
import ManualSendTab from './components/ManualSendTab';
import LogTab from './components/LogTab';

type TabKey = 'schedule' | 'manual' | 'log';

const TAB_ITEMS = [
  { id: 'schedule', label: 'Lịch tự động' },
  { id: 'manual', label: 'Gửi ngay' },
  { id: 'log', label: 'Nhật ký' },
];

const NotificationsPage: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('schedule');

  return (
    <Box layoutClassName="space-y-5 p-4">
      <Box>
        <Heading level={2}>Thông báo</Heading>
        <Typography variant="muted" size="sm">
          Lịch tự động, gửi thủ công và nhật ký gửi — gom mọi kênh (hiện có Zalo + trong ứng dụng).
        </Typography>
      </Box>

      <Tabs items={TAB_ITEMS} value={tab} onChange={(v) => setTab(v as TabKey)} />

      {tab === 'schedule' && <ScheduleTab />}
      {tab === 'manual' && <ManualSendTab />}
      {tab === 'log' && <LogTab />}
    </Box>
  );
};

export default NotificationsPage;

import React, { useState } from 'react';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import Tabs from '@/components/ui/Tabs';
import TrafficDashboard from './components/TrafficDashboard';
import LogsTable from './components/LogsTable';

type TabKey = 'overview' | 'logs' | 'errors';

const TAB_ITEMS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'logs', label: 'Nhật ký' },
  { id: 'errors', label: 'Lỗi & cảnh báo' },
];

const RequestLogsPage: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('overview');

  return (
    <Box layoutClassName="space-y-5">
      <Box>
        <Heading level={2}>Giám sát hệ thống</Heading>
        <Typography variant="muted" size="sm">
          Theo dõi lưu lượng truy cập, nhật ký request và lỗi trên hệ thống.
        </Typography>
      </Box>

      <Tabs items={TAB_ITEMS} value={tab} onChange={(v) => setTab(v as TabKey)} />

      {tab === 'overview' && <TrafficDashboard />}
      {tab === 'logs' && <LogsTable />}
      {tab === 'errors' && <TrafficDashboard errorsOnly />}
    </Box>
  );
};

export default RequestLogsPage;

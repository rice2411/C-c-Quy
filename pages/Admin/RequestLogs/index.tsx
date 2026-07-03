import React, { useState } from 'react';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import Tabs from '@/components/ui/Tabs';
import TrafficDashboard from './components/TrafficDashboard';
import LogsTable from './components/LogsTable';
import ErrorGroupsTable from './components/ErrorGroupsTable';
import HealthTab from './components/HealthTab';

type TabKey = 'overview' | 'logs' | 'errors' | 'health';

const TAB_ITEMS = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'logs', label: 'Nhật ký' },
  { id: 'errors', label: 'Lỗi & cảnh báo' },
  { id: 'health', label: 'Sức khỏe' },
];

const RequestLogsPage: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('overview');

  return (
    <Box layoutClassName="space-y-5">
      <Box>
        <Heading level={2}>Giám sát hệ thống</Heading>
        <Typography variant="muted" size="sm">
          Theo dõi lưu lượng, hiệu năng, nhật ký request, lỗi và sức khỏe hệ thống.
        </Typography>
      </Box>

      <Tabs items={TAB_ITEMS} value={tab} onChange={(v) => setTab(v as TabKey)} />

      {tab === 'overview' && <TrafficDashboard />}
      {tab === 'logs' && <LogsTable />}
      {tab === 'errors' && <ErrorGroupsTable />}
      {tab === 'health' && <HealthTab />}
    </Box>
  );
};

export default RequestLogsPage;

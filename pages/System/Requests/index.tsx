import React from 'react';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import LogsTable from '@/pages/System/components/LogsTable';

const SystemLogsPage: React.FC = () => (
  <Box layoutClassName="space-y-5">
    <Box>
      <Heading level={2}>Nhật ký request</Heading>
      <Typography variant="muted" size="sm">
        Toàn bộ request (IP, vị trí, người dùng, tài nguyên) — lọc & xem chi tiết.
      </Typography>
    </Box>
    <LogsTable />
  </Box>
);

export default SystemLogsPage;

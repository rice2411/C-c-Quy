import React from 'react';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import TrafficDashboard from '@/pages/System/components/TrafficDashboard';

const SystemTrafficPage: React.FC = () => (
  <Box layoutClassName="space-y-5">
    <Box>
      <Heading level={2}>Lưu lượng truy cập</Heading>
      <Typography variant="muted" size="sm">
        Tổng quan traffic, hiệu năng (percentiles), thiết bị/nguồn khách và endpoint chậm.
      </Typography>
    </Box>
    <TrafficDashboard />
  </Box>
);

export default SystemTrafficPage;

import React from 'react';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import HealthTab from '@/pages/System/components/HealthTab';

const SystemHealthPage: React.FC = () => (
  <Box layoutClassName="space-y-5">
    <Box>
      <Heading level={2}>Sức khỏe hệ thống</Heading>
      <Typography variant="muted" size="sm">
        Trạng thái backend: kết nối DB, độ trễ, uptime, môi trường, phiên bản.
      </Typography>
    </Box>
    <HealthTab />
  </Box>
);

export default SystemHealthPage;

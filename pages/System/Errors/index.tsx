import React from 'react';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import ErrorGroupsTable from '@/pages/System/components/ErrorGroupsTable';

const SystemErrorsPage: React.FC = () => (
  <Box layoutClassName="space-y-5">
    <Box>
      <Heading level={2}>Lỗi & cảnh báo</Heading>
      <Typography variant="muted" size="sm">
        Gom lỗi theo endpoint + status (kiểu Sentry), cảnh báo khi 5xx vượt ngưỡng.
      </Typography>
    </Box>
    <ErrorGroupsTable />
  </Box>
);

export default SystemErrorsPage;

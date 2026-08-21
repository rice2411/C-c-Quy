import React from 'react';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import ScheduleTab from './components/ScheduleTab';

/** Thông báo định kỳ — chỉ còn lịch tự động (đã bỏ gửi ngay + nhật ký). */
const NotificationsPage: React.FC = () => (
  <Box layoutClassName="space-y-5 p-4">
    <Box>
      <Heading level={2}>Thông báo định kỳ</Heading>
      <Typography variant="muted" size="sm">
        Lịch gửi thông báo tự động theo định kỳ — gom mọi kênh (hiện có Zalo + trong ứng dụng).
      </Typography>
    </Box>

    <ScheduleTab />
  </Box>
);

export default NotificationsPage;

import React from 'react';
import { CalendarClock } from 'lucide-react';
import Box from '@/components/ui/Box';
import PageContainer from '@/components/ui/PageContainer';
import Heading from '@/components/ui/Heading';
import ShiftSettingsTab from '@/pages/WorkConfig/ShiftSettingsTab';

/** Trang "Ca làm" — định nghĩa ca cố định (giờ giấc, hệ số công, thứ áp dụng).
 *  Tách riêng khỏi hub Chấm công & lương, đứng cùng cấp trong menu Nhân sự. */
const ShiftsPage: React.FC = () => (
  <PageContainer>
    <Box layoutClassName="flex items-center gap-2">
      <CalendarClock className="h-5 w-5 text-primary-500" />
      <Heading level={1} textClassName="text-lg font-bold text-slate-900 dark:text-white">
        Ca làm
      </Heading>
    </Box>
    <Box layoutClassName="min-h-0 flex-1 overflow-y-auto">
      <ShiftSettingsTab />
    </Box>
  </PageContainer>
);

export default ShiftsPage;

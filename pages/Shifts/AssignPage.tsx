import React from 'react';
import { CalendarRange } from 'lucide-react';
import Box from '@/components/ui/Box';
import PageContainer from '@/components/ui/PageContainer';
import Heading from '@/components/ui/Heading';
import AdminShiftBoard from '@/pages/Attendance/components/AdminShiftBoard';

/** Trang "Xếp ca" — admin phân/sửa ca cho nhân viên theo tuần. Thuộc nhóm Ca làm. */
const ShiftAssignPage: React.FC = () => (
  <PageContainer>
    <Box layoutClassName="flex items-center gap-2">
      <CalendarRange className="h-5 w-5 text-primary-500" />
      <Heading level={1} textClassName="text-lg font-bold text-slate-900 dark:text-white">
        Xếp ca
      </Heading>
    </Box>
    <Box layoutClassName="min-h-0 flex-1 overflow-y-auto">
      <AdminShiftBoard />
    </Box>
  </PageContainer>
);

export default ShiftAssignPage;

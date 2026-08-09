import React from 'react';
import { UserCheck } from 'lucide-react';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import ManageTab from './components/ManageTab';

/** Màn QUẢN LÝ CHẤM CÔNG (admin/super_admin): cấu hình IP quán, đăng ký khuôn mặt, tổng quan + lịch sử. */
const AttendanceManagePage: React.FC = () => {
  return (
    <Box layoutClassName="flex h-full flex-col gap-4 p-4 sm:p-6">
      <Box layoutClassName="flex items-center gap-2">
        <UserCheck className="h-5 w-5 text-primary-500" />
        <Heading level={1} textClassName="text-lg font-bold text-slate-900 dark:text-white">
          Quản lý chấm công
        </Heading>
      </Box>

      <Box layoutClassName="flex-1 overflow-y-auto">
        <ManageTab />
      </Box>
    </Box>
  );
};

export default AttendanceManagePage;

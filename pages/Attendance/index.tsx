import React from 'react';
import { Clock } from 'lucide-react';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import CheckInTab from './components/CheckInTab';

/** Màn CHẤM CÔNG cho NV: chấm công vào/tan ca (Face ID). Đăng ký ca tách sang trang riêng. */
const AttendancePage: React.FC = () => (
  <Box layoutClassName="flex h-full flex-col gap-4 p-4 sm:p-6">
    <Box layoutClassName="flex items-center gap-2">
      <Clock className="h-5 w-5 text-primary-500" />
      <Heading level={1} textClassName="text-lg font-bold text-slate-900 dark:text-white">
        Chấm công
      </Heading>
    </Box>

    <Box layoutClassName="flex-1 overflow-y-auto">
      <CheckInTab />
    </Box>
  </Box>
);

export default AttendancePage;

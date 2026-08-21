import React from 'react';
import { CalendarCheck } from 'lucide-react';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import RegisterTab from './components/RegisterTab';

/** Màn ĐĂNG KÝ CA (NV tự tick ca sẽ làm cho tuần sau) — tách riêng khỏi trang Chấm công. */
const ShiftRegisterPage: React.FC = () => (
  <Box layoutClassName="flex h-full flex-col gap-4 p-4 sm:p-6">
    <Box layoutClassName="flex items-center gap-2">
      <CalendarCheck className="h-5 w-5 text-primary-500" />
      <Heading level={1} textClassName="text-lg font-bold text-slate-900 dark:text-white">
        Đăng ký ca
      </Heading>
    </Box>

    <Box layoutClassName="min-h-0 flex-1 overflow-y-auto">
      <RegisterTab />
    </Box>
  </Box>
);

export default ShiftRegisterPage;

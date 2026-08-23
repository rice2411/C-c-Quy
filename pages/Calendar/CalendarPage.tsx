import React from 'react';
import { CalendarDays } from 'lucide-react';
import Box from '@/components/ui/Box';
import PageContainer from '@/components/ui/PageContainer';
import Heading from '@/components/ui/Heading';
import CalendarView from './index';

/** Trang Lịch độc lập (tách khỏi "Công & ca" cũ) — bọc CalendarView với tiêu đề. */
const CalendarPage: React.FC = () => (
  <PageContainer>
    <Box layoutClassName="flex items-center gap-2">
      <CalendarDays className="h-5 w-5 text-primary-500" />
      <Heading level={1} textClassName="text-lg font-bold text-slate-900 dark:text-white">
        Lịch
      </Heading>
    </Box>
    <Box layoutClassName="min-h-0 flex-1">
      <CalendarView />
    </Box>
  </PageContainer>
);

export default CalendarPage;

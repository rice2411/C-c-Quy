import React from 'react';
import { TrendingUp } from 'lucide-react';
import FinanceLayout from './FinanceLayout';
import RevenueTab from '@/pages/Transactions/RevenueTab';
import ReconciliationTab from '@/pages/Transactions/ReconciliationTab';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';

// Doanh thu: biểu đồ doanh thu/lợi nhuận + ĐỐI SOÁT (khớp đơn / hoàn tiền / kết toán).
const FinanceRevenuePage: React.FC = () => (
  <FinanceLayout title="Doanh thu" icon={TrendingUp}>
    {({ fromDate, toDate }) => (
      <Box layoutClassName="space-y-6">
        <RevenueTab fromDate={fromDate} toDate={toDate} />
        <Box layoutClassName="space-y-3">
          <Typography as="h2" layoutClassName="text-base font-bold" textClassName="text-slate-900 dark:text-white">
            Đối soát giao dịch
          </Typography>
          <ReconciliationTab fromDate={fromDate} toDate={toDate} />
        </Box>
      </Box>
    )}
  </FinanceLayout>
);

export default FinanceRevenuePage;

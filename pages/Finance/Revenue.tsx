import React from 'react';
import { TrendingUp } from 'lucide-react';
import FinanceLayout from './FinanceLayout';
import RevenueTab from '@/pages/Transactions/RevenueTab';

// Doanh thu: biểu đồ doanh thu/lợi nhuận theo kỳ. (Đối soát đã tách sang tab riêng.)
const FinanceRevenuePage: React.FC = () => (
  <FinanceLayout title="Doanh thu" icon={TrendingUp}>
    {({ fromDate, toDate }) => <RevenueTab fromDate={fromDate} toDate={toDate} />}
  </FinanceLayout>
);

export default FinanceRevenuePage;

import React from 'react';
import FinanceLayout from './FinanceLayout';
import RevenueTab from '@/pages/Transactions/RevenueTab';

// Doanh thu: biểu đồ doanh thu/lợi nhuận theo kỳ. (Đối soát đã tách sang tab riêng.)
const FinanceRevenuePage: React.FC = () => (
  <FinanceLayout>
    {({ fromDate, toDate }) => <RevenueTab fromDate={fromDate} toDate={toDate} />}
  </FinanceLayout>
);

export default FinanceRevenuePage;

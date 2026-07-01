import React from 'react';
import FinanceLayout from './FinanceLayout';
import ReconciliationTab from '@/pages/Transactions/ReconciliationTab';

// Đối soát giao dịch (khớp đơn / hoàn tiền / kết toán) — tab riêng, tách khỏi Doanh thu.
const FinanceReconciliationPage: React.FC = () => (
  <FinanceLayout>
    {({ fromDate, toDate }) => <ReconciliationTab fromDate={fromDate} toDate={toDate} />}
  </FinanceLayout>
);

export default FinanceReconciliationPage;

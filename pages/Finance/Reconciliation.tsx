import React from 'react';
import { ArrowRightLeft } from 'lucide-react';
import FinanceLayout from './FinanceLayout';
import ReconciliationTab from '@/pages/Transactions/ReconciliationTab';

// Đối soát giao dịch (khớp đơn / hoàn tiền / kết toán) — tab riêng, tách khỏi Doanh thu.
const FinanceReconciliationPage: React.FC = () => (
  <FinanceLayout title="Đối soát" icon={ArrowRightLeft}>
    {({ fromDate, toDate }) => <ReconciliationTab fromDate={fromDate} toDate={toDate} />}
  </FinanceLayout>
);

export default FinanceReconciliationPage;

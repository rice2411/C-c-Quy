import React from 'react';
import { Coins } from 'lucide-react';
import FinanceLayout from './FinanceLayout';
import TransactionsSummary from '@/pages/Transactions/TransactionsSummary';

// Giao dịch: chỉ tổng tiền vào / tiền ra + danh sách. Đối soát nằm ở màn Doanh thu.
const FinanceTransactionsPage: React.FC = () => (
  <FinanceLayout title="Giao dịch" icon={Coins}>
    {({ fromDate, toDate }) => <TransactionsSummary fromDate={fromDate} toDate={toDate} />}
  </FinanceLayout>
);

export default FinanceTransactionsPage;

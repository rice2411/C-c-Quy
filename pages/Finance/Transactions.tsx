import React from 'react';
import { Coins } from 'lucide-react';
import FinanceLayout from './FinanceLayout';
import ReconciliationTab from '@/pages/Transactions/ReconciliationTab';

const FinanceTransactionsPage: React.FC = () => (
  <FinanceLayout title="Giao dịch" icon={Coins}>
    {({ fromDate, toDate }) => <ReconciliationTab fromDate={fromDate} toDate={toDate} />}
  </FinanceLayout>
);

export default FinanceTransactionsPage;

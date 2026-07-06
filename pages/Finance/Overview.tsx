import React from 'react';
import FinanceLayout from './FinanceLayout';
import OverviewTab from '@/pages/Transactions/OverviewTab';

const FinanceOverviewPage: React.FC = () => (
  <FinanceLayout>
    {({ fromDate, toDate }) => <OverviewTab fromDate={fromDate} toDate={toDate} />}
  </FinanceLayout>
);

export default FinanceOverviewPage;

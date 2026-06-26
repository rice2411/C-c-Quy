import React from 'react';
import { LayoutDashboard } from 'lucide-react';
import FinanceLayout from './FinanceLayout';
import OverviewTab from '@/pages/Transactions/OverviewTab';

const FinanceOverviewPage: React.FC = () => (
  <FinanceLayout title="Tổng quan" icon={LayoutDashboard}>
    {({ fromDate, toDate }) => <OverviewTab fromDate={fromDate} toDate={toDate} />}
  </FinanceLayout>
);

export default FinanceOverviewPage;

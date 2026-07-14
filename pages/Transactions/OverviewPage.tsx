import React from 'react';
import TransactionsLayout from './TransactionsLayout';
import OverviewTab from './OverviewTab';

const OverviewPage: React.FC = () => (
  <TransactionsLayout>{({ fromDate, toDate }) => <OverviewTab fromDate={fromDate} toDate={toDate} />}</TransactionsLayout>
);

export default OverviewPage;

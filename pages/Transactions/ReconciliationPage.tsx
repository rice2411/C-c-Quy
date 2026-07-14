import React from 'react';
import TransactionsLayout from './TransactionsLayout';
import ReconciliationTab from './ReconciliationTab';

const ReconciliationPage: React.FC = () => (
  <TransactionsLayout>{({ fromDate, toDate }) => <ReconciliationTab fromDate={fromDate} toDate={toDate} />}</TransactionsLayout>
);

export default ReconciliationPage;

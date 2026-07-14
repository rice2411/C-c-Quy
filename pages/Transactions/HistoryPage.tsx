import React from 'react';
import TransactionsLayout from './TransactionsLayout';
import TransactionsSummary from './TransactionsSummary';

const HistoryPage: React.FC = () => (
  <TransactionsLayout>{({ fromDate, toDate }) => <TransactionsSummary fromDate={fromDate} toDate={toDate} />}</TransactionsLayout>
);

export default HistoryPage;

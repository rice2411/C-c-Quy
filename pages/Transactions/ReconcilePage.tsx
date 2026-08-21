import React from 'react';
import TransactionsLayout from './TransactionsLayout';
import ReconciliationTab from './ReconciliationTab';

/** Màn CẦN ĐỐI SOÁT — tách riêng khỏi Sổ giao dịch. DateRangePicker chung (mặc định hôm nay). */
const ReconcilePage: React.FC = () => (
  <TransactionsLayout defaultToday>
    {({ fromDate, toDate }) => <ReconciliationTab fromDate={fromDate} toDate={toDate} />}
  </TransactionsLayout>
);

export default ReconcilePage;

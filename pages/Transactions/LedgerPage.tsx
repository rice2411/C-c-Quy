import React from 'react';
import TransactionsLayout from './TransactionsLayout';
import LedgerBook from './components/ledger/LedgerBook';

/**
 * Sổ Giao Dịch — bảng thu/chi thống nhất: filter chuẩn (như Orders), phân trang + summary
 * server-side. Phần "Cần đối soát" đã tách sang màn riêng (/finance/reconcile).
 */
const LedgerPage: React.FC = () => (
  <TransactionsLayout defaultToday>
    {({ fromDate, toDate }) => <LedgerBook fromDate={fromDate} toDate={toDate} />}
  </TransactionsLayout>
);

export default LedgerPage;

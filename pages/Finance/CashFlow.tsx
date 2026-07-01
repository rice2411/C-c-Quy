import React from 'react';
import FinanceLayout from './FinanceLayout';
import CashFlowTab from '@/pages/Transactions/CashFlowTab';

// Dòng tiền: liệt kê chi tiết tiền vào / tiền nhập hàng / tiền ra theo kỳ.
const FinanceCashFlowPage: React.FC = () => (
  <FinanceLayout>
    {({ fromDate, toDate }) => <CashFlowTab fromDate={fromDate} toDate={toDate} />}
  </FinanceLayout>
);

export default FinanceCashFlowPage;

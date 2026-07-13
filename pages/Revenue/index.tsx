import React, { useState } from 'react';
import { Wallet } from 'lucide-react';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';
import Tabs from '@/components/ui/Tabs';
import DateRangePicker, { DatePreset, computePresetRange } from '@/components/ui/DateRangePicker';
import OverviewTab from '@/pages/Transactions/OverviewTab';
import RevenueTab from '@/pages/Transactions/RevenueTab';
import ReconciliationTab from '@/pages/Transactions/ReconciliationTab';

type TopTab = 'overview' | 'revenue' | 'transactions';

const fmtRange = (d: string) => (d ? d.split('-').reverse().join('/') : '');

// Màn "Tài chính" — gom Tổng quan + Doanh thu + Giao dịch (đối soát/kết toán) vào 1 màn.
const FinancePage: React.FC = () => {
  const initial = computePresetRange('month');
  const [fromDate, setFromDate] = useState(initial.from);
  const [toDate, setToDate] = useState(initial.to);
  const [preset, setPreset] = useState<DatePreset>('month');
  const [tab, setTab] = useState<TopTab>('overview');

  const applyPreset = (p: DatePreset) => {
    if (p !== 'custom') {
      const r = computePresetRange(p);
      setFromDate(r.from);
      setToDate(r.to);
    }
    setPreset(p);
  };

  const tabItems = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'revenue', label: 'Doanh thu' },
    { id: 'transactions', label: 'Giao dịch' },
  ];

  return (
    <Box layoutClassName="flex h-full flex-col space-y-4 sm:space-y-5">
      {/* Lọc thời gian dùng chung */}
      <DateRangePicker
        fromDate={fromDate}
        toDate={toDate}
        preset={preset}
        onApplyPreset={applyPreset}
        onFromChange={(v) => { setFromDate(v); setPreset('custom'); }}
        onToChange={(v) => { setToDate(v); setPreset('custom'); }}
      />

      {/* Tabs */}
      <Tabs items={tabItems} value={tab} onChange={(v) => setTab(v as TopTab)} />

      {/* Nội dung tab */}
      <Box layoutClassName="flex-1 overflow-y-auto">
        {tab === 'overview' && <OverviewTab fromDate={fromDate} toDate={toDate} />}
        {tab === 'revenue' && <RevenueTab fromDate={fromDate} toDate={toDate} />}
        {tab === 'transactions' && <ReconciliationTab fromDate={fromDate} toDate={toDate} />}
      </Box>
    </Box>
  );
};

export default FinancePage;

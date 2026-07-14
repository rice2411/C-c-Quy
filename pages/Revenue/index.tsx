import React, { useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Tabs from '@/components/ui/Tabs';
import DateRangePicker, { DatePreset, computePresetRange } from '@/components/ui/DateRangePicker';
import OverviewTab from '@/pages/Transactions/OverviewTab';
import TransactionsSummary from '@/pages/Transactions/TransactionsSummary';
import ReconciliationTab from '@/pages/Transactions/ReconciliationTab';

type TopTab = 'overview' | 'history' | 'reconciliation';

// Màn "Giao dịch" — tab mẹ gồm 3 tab con: Tổng quan · Lịch sử · Đối soát.
const TransactionsHubPage: React.FC = () => {
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
    { id: 'history', label: 'Lịch sử' },
    { id: 'reconciliation', label: 'Đối soát' },
  ];

  return (
    <Box layoutClassName="flex h-full flex-col space-y-4 sm:space-y-5">
      <Box layoutClassName="flex flex-wrap items-center gap-2">
        <Heading level={2} layoutClassName="flex items-center gap-2" textClassName="text-lg font-semibold">
          <ArrowRightLeft className="h-5 w-5 text-primary-500" />
          Giao dịch
        </Heading>
        <Box layoutClassName="ml-auto">
          <DateRangePicker
            fromDate={fromDate}
            toDate={toDate}
            preset={preset}
            onApplyPreset={applyPreset}
            onFromChange={(v) => { setFromDate(v); setPreset('custom'); }}
            onToChange={(v) => { setToDate(v); setPreset('custom'); }}
          />
        </Box>
      </Box>

      <Tabs items={tabItems} value={tab} onChange={(v) => setTab(v as TopTab)} />

      <Box layoutClassName="flex-1 overflow-y-auto">
        {tab === 'overview' && <OverviewTab fromDate={fromDate} toDate={toDate} />}
        {tab === 'history' && <TransactionsSummary fromDate={fromDate} toDate={toDate} />}
        {tab === 'reconciliation' && <ReconciliationTab fromDate={fromDate} toDate={toDate} />}
      </Box>
    </Box>
  );
};

export default TransactionsHubPage;

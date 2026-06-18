import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';
import Tabs from '@/components/ui/Tabs';
import PeriodFilter, { DatePreset, computePresetRange } from './PeriodFilter';
import OverviewTab from './OverviewTab';
import RevenueTab from './RevenueTab';
import ReconciliationTab from './ReconciliationTab';

type TopTab = 'overview' | 'revenue' | 'reconcile';

const fmtRange = (d: string) => (d ? d.split('-').reverse().join('/') : '');

const TransactionsPage: React.FC = () => {
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
    { id: 'reconcile', label: 'Đối soát NH' },
  ];

  return (
    <Box layoutClassName="flex h-full flex-col space-y-4 sm:space-y-5">
      {/* Header */}
      <Box layoutClassName="flex items-center gap-3">
        <Box layoutClassName="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
          <TrendingUp className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </Box>
        <Box>
          <Typography as="h1" layoutClassName="text-lg font-bold sm:text-xl" textClassName="text-slate-900 dark:text-white">
            Doanh thu &amp; Lợi nhuận
          </Typography>
          <Typography as="p" size="xs" variant="muted">
            Kỳ: {fmtRange(fromDate)} — {fmtRange(toDate)}
          </Typography>
        </Box>
      </Box>

      {/* Lọc thời gian dùng chung */}
      <PeriodFilter
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
        {tab === 'reconcile' && <ReconciliationTab fromDate={fromDate} toDate={toDate} />}
      </Box>
    </Box>
  );
};

export default TransactionsPage;

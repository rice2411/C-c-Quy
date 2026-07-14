import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';
import DateRangePicker, { DatePreset, computePresetRange } from '@/components/ui/DateRangePicker';
import ReconciliationTab from './ReconciliationTab';

const fmtRange = (d: string) => (d ? d.split('-').reverse().join('/') : '');

const TransactionsPage: React.FC = () => {
  const initial = computePresetRange('month');
  const [fromDate, setFromDate] = useState(initial.from);
  const [toDate, setToDate] = useState(initial.to);
  const [preset, setPreset] = useState<DatePreset>('month');

  const applyPreset = (p: DatePreset) => {
    if (p !== 'custom') {
      const r = computePresetRange(p);
      setFromDate(r.from);
      setToDate(r.to);
    }
    setPreset(p);
  };

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

      {/* Nội dung: Đối soát ngân hàng */}
      <Box layoutClassName="flex-1 overflow-y-auto">
        <ReconciliationTab fromDate={fromDate} toDate={toDate} />
      </Box>
    </Box>
  );
};

export default TransactionsPage;

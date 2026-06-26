import React, { useState } from 'react';
import { LucideIcon } from 'lucide-react';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';
import PeriodFilter, { DatePreset, computePresetRange } from '@/pages/Transactions/PeriodFilter';

const fmtRange = (d: string) => (d ? d.split('-').reverse().join('/') : '');

interface FinanceLayoutProps {
  title: string;
  icon: LucideIcon;
  // render nội dung theo kỳ đã chọn (mỗi sub-screen tự quản lý kỳ riêng).
  children: (range: { fromDate: string; toDate: string }) => React.ReactNode;
}

// Khung dùng chung cho các sub-screen của "Tài chính": header + lọc kỳ.
const FinanceLayout: React.FC<FinanceLayoutProps> = ({ title, icon: Icon, children }) => {
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
      <Box layoutClassName="flex items-center gap-3">
        <Box layoutClassName="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
          <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </Box>
        <Box>
          <Typography as="h1" layoutClassName="text-lg font-bold sm:text-xl" textClassName="text-slate-900 dark:text-white">
            {title}
          </Typography>
          <Typography as="p" size="xs" variant="muted">
            Kỳ: {fmtRange(fromDate)} — {fmtRange(toDate)}
          </Typography>
        </Box>
      </Box>

      <PeriodFilter
        fromDate={fromDate}
        toDate={toDate}
        preset={preset}
        onApplyPreset={applyPreset}
        onFromChange={(v) => { setFromDate(v); setPreset('custom'); }}
        onToChange={(v) => { setToDate(v); setPreset('custom'); }}
      />

      <Box layoutClassName="flex-1 overflow-y-auto">
        {children({ fromDate, toDate })}
      </Box>
    </Box>
  );
};

export default FinanceLayout;

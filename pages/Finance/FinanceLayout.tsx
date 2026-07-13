import React, { useState } from 'react';
import Box from '@/components/ui/Box';
import DateRangePicker, { DatePreset, computePresetRange } from '@/components/ui/DateRangePicker';

// Khung dùng chung cho các sub-screen của "Tài chính": lọc kỳ + nội dung.
// Tiêu đề trang do thanh header của Layout hiển thị (theo route), không lặp ở đây.
interface FinanceLayoutProps {
  // render nội dung theo kỳ đã chọn (mỗi sub-screen tự quản lý kỳ riêng).
  children: (range: { fromDate: string; toDate: string }) => React.ReactNode;
}

const FinanceLayout: React.FC<FinanceLayoutProps> = ({ children }) => {
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
      <DateRangePicker
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

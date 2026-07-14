import React, { useState } from 'react';
import Box from '@/components/ui/Box';
import DateRangePicker, { DatePreset, computePresetRange } from '@/components/ui/DateRangePicker';

/** Lưu period dùng chung 3 page con "Giao dịch" (giữ khi chuyển trang). */
const LS_KEY = 'tx.period';
type Saved = { fromDate: string; toDate: string; preset: DatePreset };
const loadSaved = (): Saved => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Saved;
      if (p.fromDate && p.toDate && p.preset) return p;
    }
  } catch { /* bỏ qua */ }
  const r = computePresetRange('month');
  return { fromDate: r.from, toDate: r.to, preset: 'month' };
};

interface TransactionsLayoutProps {
  children: (range: { fromDate: string; toDate: string }) => React.ReactNode;
}

/** Khung 3 page con Giao dịch: DateRangePicker chung + render nội dung theo period. */
const TransactionsLayout: React.FC<TransactionsLayoutProps> = ({ children }) => {
  const [state, setState] = useState<Saved>(loadSaved);

  const persist = (next: Saved) => {
    setState(next);
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* bỏ qua */ }
  };

  const applyPreset = (p: DatePreset) => {
    if (p !== 'custom') {
      const r = computePresetRange(p);
      persist({ fromDate: r.from, toDate: r.to, preset: p });
    } else {
      persist({ ...state, preset: 'custom' });
    }
  };

  return (
    <Box layoutClassName="flex h-full flex-col space-y-4">
      <DateRangePicker
        fromDate={state.fromDate}
        toDate={state.toDate}
        preset={state.preset}
        onApplyPreset={applyPreset}
        onFromChange={(v) => persist({ ...state, fromDate: v, preset: 'custom' })}
        onToChange={(v) => persist({ ...state, toDate: v, preset: 'custom' })}
      />
      <Box layoutClassName="flex-1 overflow-y-auto">
        {children({ fromDate: state.fromDate, toDate: state.toDate })}
      </Box>
    </Box>
  );
};

export default TransactionsLayout;

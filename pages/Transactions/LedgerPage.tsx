import React, { useState } from 'react';
import { BookOpen, GitCompareArrows } from 'lucide-react';
import TransactionsLayout from './TransactionsLayout';
import LedgerBook from './components/ledger/LedgerBook';
import ReconciliationTab from './ReconciliationTab';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';

type Mode = 'ledger' | 'reconcile';

/**
 * Sổ Giao Dịch — 1 trang gộp (Lịch sử + Đối soát cũ):
 *  • "Sổ": bảng thu/chi thống nhất, filter trạng thái/danh mục, phân trang + summary server.
 *  • "Cần đối soát": không gian đối soát tiền vào/ra (giữ nguyên logic đã có).
 */
const LedgerPage: React.FC = () => {
  const [mode, setMode] = useState<Mode>('ledger');

  const tabs: { key: Mode; label: string; icon: React.ReactNode }[] = [
    { key: 'ledger', label: 'Sổ giao dịch', icon: <BookOpen className="h-3.5 w-3.5" /> },
    { key: 'reconcile', label: 'Cần đối soát', icon: <GitCompareArrows className="h-3.5 w-3.5" /> },
  ];

  return (
    <TransactionsLayout defaultToday>
      {({ fromDate, toDate }) => (
        <Box layoutClassName="space-y-4">
          <Box layoutClassName="flex gap-1 rounded-xl border border-slate-100 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/60 sm:inline-flex">
            {tabs.map(({ key, label, icon }) => {
              const active = mode === key;
              return (
                <Button
                  key={key}
                  type="button"
                  onClick={() => setMode(key)}
                  variant="ghost"
                  disableVariantHover
                  disableVariantTextColor
                  borderClassName="border-transparent"
                  layoutClassName="flex flex-1 items-center justify-center gap-1.5 sm:flex-none"
                  roundedClassName="rounded-lg"
                  sizeClassName="px-4 py-2 text-xs"
                  stateClassName="transition-all"
                  backgroundClassName={active ? 'bg-white shadow-sm dark:bg-slate-700' : 'bg-transparent'}
                  textClassName={active ? 'font-semibold text-slate-900 dark:text-white' : 'font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}
                >
                  <Box layoutClassName={active ? 'text-primary-500' : ''}>{icon}</Box>
                  <Typography as="span">{label}</Typography>
                </Button>
              );
            })}
          </Box>

          {mode === 'ledger'
            ? <LedgerBook fromDate={fromDate} toDate={toDate} />
            : <ReconciliationTab fromDate={fromDate} toDate={toDate} />}
        </Box>
      )}
    </TransactionsLayout>
  );
};

export default LedgerPage;

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, Calendar, CreditCard, Building2 } from 'lucide-react';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Heading from '@/components/ui/Heading';
import Typography from '@/components/ui/Typography';
import { Transaction } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchTransactions } from '@/services/transactionService';
import { formatVND } from '@/utils/format/currencyUtil';

const DashboardRecentTransactions: React.FC = () => {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchTransactions();
        setTransactions(data);
      } catch (e) {
        console.error('Error loading recent transactions for dashboard:', e);
      }
    };
    load();
  }, []);

  const recentTransactions = useMemo(
    () =>
      transactions
        .filter((tr) => tr.transferType === 'in')
        .slice(0, 5),
    [transactions]
  );

  if (recentTransactions.length === 0) return null;

  return (
    <Card layoutClassName="p-4 sm:p-5">
      <Box layoutClassName="mb-4 flex items-center justify-between">
        <Heading level={3} layoutClassName="flex items-center gap-2" textClassName="text-sm font-semibold text-slate-800 dark:text-white">
          <ArrowRightLeft className="w-4 h-4 text-emerald-500" />
          {t('dashboard.recentTransactions') || 'Recent transactions'}
        </Heading>
      </Box>
      <Box layoutClassName="space-y-2">
        {recentTransactions.map((tr) => (
          <Box
            key={tr.id}
            layoutClassName="flex items-center justify-between gap-3 px-2.5 py-2.5"
            roundedClassName="rounded-lg"
            hoverClassName="hover:bg-slate-50 dark:hover:bg-slate-700/60"
            stateClassName="transition-colors"
          >
            <Box layoutClassName="flex min-w-0 items-center gap-3">
              <Box layoutClassName="flex h-9 w-9 flex-shrink-0 items-center justify-center" roundedClassName="rounded-full" backgroundClassName="bg-emerald-50 dark:bg-emerald-900/20">
                <ArrowRightLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </Box>
              <Box layoutClassName="flex min-w-0 flex-col">
                <Typography as="span" layoutClassName="truncate" textClassName="text-xs font-semibold text-emerald-700 dark:text-emerald-300 sm:text-sm">
                  +{formatVND(tr.transferAmount)}
                </Typography>
                <Box layoutClassName="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <Calendar className="w-3 h-3" />
                  <Typography as="span" layoutClassName="truncate">
                    {new Date(tr.transactionDate).toLocaleString(
                      t('language') === 'vi' ? 'vi-VN' : 'en-US'
                    )}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box layoutClassName="flex flex-shrink-0 flex-col items-end gap-1">
              <Box layoutClassName="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <Building2 className="w-3.5 h-3.5" />
                <Typography as="span" layoutClassName="truncate max-w-[90px] sm:max-w-[120px]">
                  {tr.gateway || '-'}
                </Typography>
              </Box>
              <Box layoutClassName="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <CreditCard className="w-3.5 h-3.5" />
                <Typography as="span" layoutClassName="max-w-[110px] truncate sm:max-w-[140px]" textClassName="font-mono">
                  {tr.subAccount || tr.accountNumber || '-'}
                </Typography>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Card>
  );
};

export default DashboardRecentTransactions;



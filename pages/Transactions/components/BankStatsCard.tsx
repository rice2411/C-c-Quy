import React, { useMemo } from 'react';
import { Building2 } from 'lucide-react';
import { Transaction } from '@/types';
import { formatVND } from '@/utils/format/currencyUtil';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';

// Thống kê tiền vào/ra + số GD theo từng ngân hàng (gateway). Dùng chung cho Giao dịch + Tổng quan.
const BankStatsCard: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const bankStats = useMemo(() => {
    const map = new Map<string, { bank: string; in: number; out: number; count: number }>();
    transactions.forEach((tr) => {
      const bank = tr.gateway || 'Khác';
      const cur = map.get(bank) ?? { bank, in: 0, out: 0, count: 0 };
      if (tr.transferType === 'out') cur.out += tr.transferAmount;
      else cur.in += tr.transferAmount;
      cur.count += 1;
      map.set(bank, cur);
    });
    return Array.from(map.values()).sort((a, b) => (b.in + b.out) - (a.in + a.out));
  }, [transactions]);

  return (
    <Card padding="md" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
      <Box layoutClassName="mb-3 flex items-center gap-2">
        <Building2 className="h-4 w-4 text-primary-500" />
        <Typography size="xs" variant="muted" layoutClassName="font-semibold uppercase tracking-wide">Thống kê theo ngân hàng</Typography>
      </Box>
      {bankStats.length === 0 ? (
        <Box
          layoutClassName="flex items-center justify-between gap-2 rounded-xl p-3"
          borderClassName="border border-slate-100 dark:border-slate-700"
          backgroundClassName="bg-slate-50/60 dark:bg-slate-900/30">
          <Typography as="span" size="sm" variant="muted">Chưa có giao dịch trong kỳ · 0 GD</Typography>
          <Box layoutClassName="flex items-center gap-2">
            <Typography as="span" size="xs" layoutClassName="font-medium" textClassName="text-emerald-600 dark:text-emerald-400">+{formatVND(0)}</Typography>
            <Typography as="span" size="xs" layoutClassName="font-medium" textClassName="text-rose-600 dark:text-rose-400">−{formatVND(0)}</Typography>
          </Box>
        </Box>
      ) : (
      <Box layoutClassName="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {bankStats.map((b) => (
          <Box
            key={b.bank}
            layoutClassName="flex flex-col gap-1.5 rounded-xl p-3"
            borderClassName="border border-slate-100 dark:border-slate-700"
            backgroundClassName="bg-slate-50/60 dark:bg-slate-900/30">
            <Box layoutClassName="flex items-center justify-between gap-2">
              <Typography as="span" size="sm" layoutClassName="truncate font-semibold" textClassName="text-slate-800 dark:text-slate-100">{b.bank}</Typography>
              <Typography as="span" size="xs" variant="muted">{b.count} GD</Typography>
            </Box>
            <Box layoutClassName="flex items-center justify-between gap-2">
              <Typography as="span" size="xs" layoutClassName="font-medium" textClassName="text-emerald-600 dark:text-emerald-400">+{formatVND(b.in)}</Typography>
              <Typography as="span" size="xs" layoutClassName="font-medium" textClassName="text-rose-600 dark:text-rose-400">−{formatVND(b.out)}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
      )}
    </Card>
  );
};

export default BankStatsCard;

import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, TrendingUp, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTransactions } from '@/hooks/queries/useTransactionsQuery';
import { formatVND } from '@/utils/format/currencyUtil';
import StatsBanner from '@/pages/StockReceipts/StatsBanner';
import FilterToolbar from '@/components/shared/FilterToolbar';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import Typography from '@/components/ui/Typography';
import TransactionsDesktopTable from './components/desktop/TransactionsDesktopTable';
import TransactionsMobileList from './components/mobile/TransactionsMobileList';
import TransactionDetailModal from './components/TransactionDetailModal';
import { Transaction } from '@/types';

// Màn Giao dịch (gọn): chỉ tổng tiền vào / tiền ra + danh sách giao dịch (xem).
// Phần đối soát (khớp đơn / hoàn tiền / kết toán) nằm ở màn Doanh thu.
const TransactionsSummary: React.FC<{ fromDate: string; toDate: string }> = ({ fromDate, toDate }) => {
  const { t } = useLanguage();
  const { transactions, loading, error } = useTransactions();
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  React.useEffect(() => {
    if (error) toast.error(t('transactions.loadError') || 'Không tải được giao dịch');
  }, [error, t]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch { return dateStr; }
  };

  const filtered = useMemo(() => {
    let list = transactions;
    if (fromDate) {
      const from = new Date(fromDate);
      list = list.filter(tr => new Date(tr.transactionDate) >= from);
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      list = list.filter(tr => new Date(tr.transactionDate) <= to);
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(tr =>
        (tr.content && tr.content.toLowerCase().includes(q)) ||
        (tr.orderNumber && tr.orderNumber.toLowerCase().includes(q)) ||
        (tr.description && tr.description.toLowerCase().includes(q)) ||
        (tr.accountNumber && tr.accountNumber.toLowerCase().includes(q))
      );
    }
    return list;
  }, [transactions, fromDate, toDate, searchTerm]);

  const totalIn = useMemo(
    () => filtered.filter(tr => tr.transferType === 'in').reduce((s, tr) => s + tr.transferAmount, 0),
    [filtered],
  );
  const totalOut = useMemo(
    () => filtered.filter(tr => tr.transferType === 'out').reduce((s, tr) => s + tr.transferAmount, 0),
    [filtered],
  );

  // Thống kê tiền vào/ra + số GD theo từng ngân hàng (gateway)
  const bankStats = useMemo(() => {
    const map = new Map<string, { bank: string; in: number; out: number; count: number }>();
    filtered.forEach((tr) => {
      const bank = tr.gateway || 'Khác';
      const cur = map.get(bank) ?? { bank, in: 0, out: 0, count: 0 };
      if (tr.transferType === 'out') cur.out += tr.transferAmount;
      else cur.in += tr.transferAmount;
      cur.count += 1;
      map.set(bank, cur);
    });
    return Array.from(map.values()).sort((a, b) => (b.in + b.out) - (a.in + a.out));
  }, [filtered]);

  const handleClick = (tr: Transaction) => { setSelected(tr); setDetailOpen(true); };

  if (loading) {
    return <Box layoutClassName="flex flex-1 items-center justify-center py-16"><Spinner size="lg" textClassName="text-primary-500" /></Box>;
  }

  return (
    <Box layoutClassName="space-y-4">
      <StatsBanner
        items={[
          { icon: TrendingUp, label: 'Tổng tiền vào', value: formatVND(totalIn), accent: '#16a34a' },
          { icon: ArrowDownLeft, label: 'Tổng tiền ra', value: formatVND(totalOut), accent: '#e11d48' },
        ]}
      />

      {bankStats.length > 0 ? (
        <Card padding="md" backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
          <Box layoutClassName="mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary-500" />
            <Typography size="xs" variant="muted" layoutClassName="font-semibold uppercase tracking-wide">Thống kê theo ngân hàng</Typography>
          </Box>
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
        </Card>
      ) : null}

      <FilterToolbar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('transactions.searchPlaceholder') || 'Tìm nội dung, mã đơn...'}
      />

      {filtered.length === 0 ? (
        <Box layoutClassName="flex flex-1 flex-col items-center justify-center gap-3 py-16" textClassName="text-slate-400 dark:text-slate-500">
          <Typography size="sm" variant="muted">{searchTerm ? 'Không tìm thấy giao dịch phù hợp' : t('transactions.noData')}</Typography>
        </Box>
      ) : (
        <>
          <TransactionsMobileList transactions={filtered} formatDate={formatDate} onTransactionClick={handleClick} />
          <TransactionsDesktopTable transactions={filtered} formatDate={formatDate} onTransactionClick={handleClick} />
        </>
      )}

      <TransactionDetailModal
        isOpen={detailOpen}
        onClose={() => { setDetailOpen(false); setSelected(null); }}
        transaction={selected}
        formatDate={formatDate}
      />
    </Box>
  );
};

export default TransactionsSummary;

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowUpRight, Search } from 'lucide-react';
import { qk } from '@/hooks/queryKeys';
import { fetchTransactions } from '@/services/transactionService';
import { Transaction } from '@/types';
import { formatVND } from '@/utils/format/currencyUtil';
import BaseModal from '@/components/BaseModal';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Chọn 1 giao dịch để đối ứng vào đơn (in → cộng, out → trừ paidAmount). */
  onPick: (tx: Transaction) => void;
  /** Đang xử lý reconcile 1 GD (khoá list). */
  busy?: boolean;
}

/**
 * Modal chọn 1 giao dịch CHƯA gán đơn để đối ứng cho đơn hiện tại.
 * Tab Vào/Ra: 'in' = thu cọc/thanh toán (+), 'out' = hoàn/đối ứng (−).
 */
const OrderTxnReconcileModal: React.FC<Props> = ({ isOpen, onClose, onPick, busy }) => {
  const [tab, setTab] = useState<'in' | 'out'>('in');
  const [search, setSearch] = useState('');

  const { data: all = [], isLoading } = useQuery({
    queryKey: qk.transactions.all,
    queryFn: fetchTransactions,
    enabled: isOpen,
  });

  const rows = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return all
      .filter((t) => !t.orderNumber && !t.isExternal && (t.transferType || 'in') === tab)
      .filter((t) =>
        !kw ||
        (t.content || '').toLowerCase().includes(kw) ||
        String(t.transferAmount || '').includes(kw) ||
        String(t.sepayId || '').includes(kw),
      );
  }, [all, tab, search]);

  const isIn = tab === 'in';

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Đối ứng giao dịch" size="lg">
      <Box layoutClassName="space-y-3">
        {/* Tab Vào / Ra */}
        <Box
          layoutClassName="inline-flex gap-1 rounded-lg p-1"
          backgroundClassName="bg-slate-100 dark:bg-slate-800"
        >
          <Button
            type="button"
            onClick={() => setTab('in')}
            variant={isIn ? 'primary' : 'ghost'}
            sizeClassName="px-3 py-1.5 text-sm"
            roundedClassName="rounded-md"
            shadowClassName=""
            layoutClassName="inline-flex items-center gap-1.5"
            disableVariantHover
          >
            <ArrowDownLeft className="h-4 w-4" /> Tiền vào
          </Button>
          <Button
            type="button"
            onClick={() => setTab('out')}
            variant={!isIn ? 'primary' : 'ghost'}
            sizeClassName="px-3 py-1.5 text-sm"
            roundedClassName="rounded-md"
            shadowClassName=""
            layoutClassName="inline-flex items-center gap-1.5"
            disableVariantHover
          >
            <ArrowUpRight className="h-4 w-4" /> Tiền ra
          </Button>
        </Box>

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo nội dung / số tiền / mã GD…"
          leftIcon={<Search />}
          leftIconClassName="[&_svg]:h-4 [&_svg]:w-4"
          fullWidth
        />

        <Typography as="p" size="xs" variant="muted">
          {isIn
            ? 'Chọn giao dịch tiền vào → cộng vào đã nhận (tự suy Đã cọc / Đã thanh toán).'
            : 'Chọn giao dịch tiền ra → trừ khỏi đã nhận (hoàn/đối ứng).'}
        </Typography>

        {/* Danh sách GD chưa gán */}
        <Box layoutClassName="max-h-[46vh] space-y-1.5 overflow-y-auto">
          {isLoading ? (
            <Typography as="p" size="sm" variant="muted" layoutClassName="py-8 text-center">
              Đang tải giao dịch…
            </Typography>
          ) : rows.length === 0 ? (
            <Typography as="p" size="sm" variant="muted" layoutClassName="py-8 text-center">
              Không có giao dịch {isIn ? 'tiền vào' : 'tiền ra'} chưa gán.
            </Typography>
          ) : (
            rows.map((t) => (
              <Button
                key={t.id}
                type="button"
                onClick={() => onPick(t)}
                disabled={busy}
                variant="ghost"
                sizeClassName="px-3 py-2"
                roundedClassName="rounded-lg"
                shadowClassName=""
                borderClassName="border border-slate-200 dark:border-slate-700"
                backgroundClassName="bg-white dark:bg-slate-800"
                hoverClassName="hover:border-primary-300 dark:hover:border-primary-700"
                layoutClassName="flex w-full items-center justify-between gap-3 text-left"
              >
                <Box layoutClassName="min-w-0 flex-1">
                  <Typography as="p" size="sm" layoutClassName="truncate font-medium" textClassName="text-slate-700 dark:text-slate-200">
                    {t.content || '(không có nội dung)'}
                  </Typography>
                  <Typography as="span" size="xs" variant="muted">
                    {t.transactionDate} · #{t.sepayId}
                  </Typography>
                </Box>
                <Typography
                  as="span"
                  size="sm"
                  layoutClassName="shrink-0 font-bold"
                  textClassName={isIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}
                >
                  {isIn ? '+' : '−'}{formatVND(Number(t.transferAmount) || 0)}
                </Typography>
              </Button>
            ))
          )}
        </Box>
      </Box>
    </BaseModal>
  );
};

export default OrderTxnReconcileModal;

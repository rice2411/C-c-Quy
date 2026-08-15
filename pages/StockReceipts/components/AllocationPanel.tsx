import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Link2, AlertTriangle, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import Box from '@/components/ui/Box';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Dropdown, { type DropdownOption } from '@/components/ui/Dropdown';
import { formatVND, formatVNDOrDash } from '@/utils/format/currencyUtil';
import {
  fetchReceiptAllocations,
  fetchAvailableOutTxns,
  addReceiptAllocation,
  removeReceiptAllocation,
  setReceiptAllocForce,
  type ReceiptAllocSummary,
  type AvailableOutTxn,
} from '@/services/stockReceiptService';

interface Props {
  receiptId: string;
  /** Báo cho cha khi trạng thái đối soát đổi (để refresh danh sách bill ngoài). */
  onChanged?: (reconciled: boolean) => void;
}

/** Gắn NHIỀU giao dịch tiền ra cho 1 bill (phân bổ theo số tiền). */
const AllocationPanel: React.FC<Props> = ({ receiptId, onChanged }) => {
  const [summary, setSummary] = useState<ReceiptAllocSummary | null>(null);
  const [available, setAvailable] = useState<AvailableOutTxn[]>([]);
  const [loading, setLoading] = useState(true);
  const [txId, setTxId] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, av] = await Promise.all([
        fetchReceiptAllocations(receiptId),
        fetchAvailableOutTxns(receiptId),
      ]);
      setSummary(s);
      setAvailable(av);
    } catch (err) {
      console.error(err);
      toast.error('Không tải được đối soát.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (receiptId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiptId]);

  // Chọn GD → gợi ý số tiền = min(còn thiếu bill, còn lại GD).
  useEffect(() => {
    if (!txId) {
      setAmount('');
      return;
    }
    const tx = available.find((t) => t.id === txId);
    const rem = summary?.remaining ?? 0;
    const suggest = tx ? Math.min(tx.remaining, rem > 0 ? rem : tx.remaining) : 0;
    setAmount(suggest > 0 ? String(Math.round(suggest)) : '');
  }, [txId, available, summary]);

  const options = useMemo<DropdownOption[]>(
    () =>
      available.map((t) => ({
        value: t.id,
        label: `${formatVND(t.remaining)}${t.remaining !== t.amount ? ` (còn của ${formatVND(t.amount)})` : ''}`,
        description: `${t.transactionDate ?? '—'}${t.content ? ` · ${t.content}` : ''}`,
      })),
    [available],
  );

  const apply = (s: ReceiptAllocSummary) => {
    setSummary(s);
    onChanged?.(s.reconciled);
  };

  const handleAdd = async () => {
    if (!txId) {
      toast.error('Chọn giao dịch để gắn.');
      return;
    }
    setBusy(true);
    try {
      const s = await addReceiptAllocation(receiptId, txId, amount ? Number(amount) : null);
      apply(s);
      setTxId('');
      setAmount('');
      setAvailable(await fetchAvailableOutTxns(receiptId));
      toast.success('Đã gắn giao dịch.');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || err?.message || 'Gắn thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const handleForce = async (forced: boolean) => {
    setBusy(true);
    try {
      const s = await setReceiptAllocForce(receiptId, forced);
      apply(s);
      toast.success(forced ? 'Đã đánh dấu khớp (dù lệch).' : 'Đã bỏ đánh dấu khớp.');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || err?.message || 'Thao tác thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (allocId: string) => {
    setBusy(true);
    try {
      const s = await removeReceiptAllocation(allocId);
      apply(s);
      setAvailable(await fetchAvailableOutTxns(receiptId));
    } catch (err) {
      console.error(err);
      toast.error('Gỡ thất bại.');
    } finally {
      setBusy(false);
    }
  };

  const paid = summary?.paid ?? 0;
  const total = summary?.total ?? null;
  const remaining = summary?.remaining ?? 0;
  const done = summary?.reconciled ?? false;
  const forced = summary?.forced ?? false;
  // Lệch giữa tiền đã gắn và tổng bill: >0 = dư, <0 = thiếu.
  const diff = total != null ? paid - total : 0;
  const mismatched = done && diff !== 0; // đã chốt khớp nhưng không đúng 100%
  // Cho phép chốt "khớp dù lệch" khi đã gắn ≥1 GD mà chưa đủ tiền.
  const canForce = !done && paid > 0 && total != null;

  return (
    <Box
      layoutClassName="space-y-3 rounded-lg p-3"
      borderClassName="border border-slate-200 dark:border-slate-700"
    >
      <Box layoutClassName="flex items-center justify-between gap-2">
        <Box layoutClassName="flex items-center gap-1.5">
          <Link2 className="h-4 w-4 text-primary-500" />
          <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-slate-700 dark:text-slate-200">
            Đối soát thanh toán
          </Typography>
        </Box>
        {loading ? null : mismatched ? (
          <Badge size="sm" layoutClassName="px-2 py-0.5 text-xs font-semibold" backgroundClassName="bg-amber-50 dark:bg-amber-900/20" textClassName="text-amber-700 dark:text-amber-300">
            Đã khớp · lệch {formatVND(Math.abs(diff))} {diff < 0 ? 'thiếu' : 'dư'}
          </Badge>
        ) : done ? (
          <Badge size="sm" layoutClassName="px-2 py-0.5 text-xs font-semibold" backgroundClassName="bg-emerald-50 dark:bg-emerald-900/20" textClassName="text-emerald-700 dark:text-emerald-300">
            Đã đủ
          </Badge>
        ) : (
          <Badge size="sm" layoutClassName="px-2 py-0.5 text-xs font-semibold" backgroundClassName="bg-amber-50 dark:bg-amber-900/20" textClassName="text-amber-700 dark:text-amber-300">
            Còn thiếu {formatVNDOrDash(remaining)}
          </Badge>
        )}
      </Box>

      {loading ? (
        <Box layoutClassName="flex justify-center py-4">
          <Spinner size="sm" textClassName="text-primary-500" />
        </Box>
      ) : (
        <>
          <Typography size="xs" textClassName="text-slate-500 dark:text-slate-400">
            Đã gắn <Typography as="span" size="xs" layoutClassName="font-semibold tabular-nums" textClassName="text-slate-700 dark:text-slate-200">{formatVND(paid)}</Typography>
            {total != null ? <> / {formatVNDOrDash(total)}</> : null}
          </Typography>

          {/* Danh sách GD đã gắn */}
          {summary && summary.allocations.length > 0 ? (
            <Box layoutClassName="space-y-1">
              {summary.allocations.map((a) => (
                <Box
                  key={a.id}
                  layoutClassName="flex items-center gap-2 rounded-md px-2 py-1.5"
                  backgroundClassName="bg-slate-50 dark:bg-slate-700/40"
                >
                  <Box layoutClassName="min-w-0 flex-1">
                    <Typography as="span" size="sm" layoutClassName="font-semibold tabular-nums" textClassName="text-slate-800 dark:text-slate-100">
                      {formatVND(a.amount)}
                    </Typography>
                    <Typography as="span" size="xs" layoutClassName="ml-2" textClassName="text-slate-500 dark:text-slate-400">
                      {a.transactionDate ?? '—'}{a.content ? ` · ${a.content}` : ''}
                    </Typography>
                  </Box>
                  <IconButton label="Gỡ" size="sm" variant="ghost" disabled={busy} onClick={() => handleRemove(a.id)}>
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography size="xs" textClassName="text-slate-400 dark:text-slate-500">
              Chưa gắn giao dịch nào.
            </Typography>
          )}

          {/* Thêm GD */}
          <Box layoutClassName="flex flex-wrap items-end gap-2">
            <Box layoutClassName="min-w-0 flex-1">
              <Dropdown
                value={txId}
                onChange={setTxId}
                options={options}
                searchable
                clearable
                placeholder={available.length ? 'Chọn giao dịch tiền ra…' : 'Không còn GD tiền ra khả dụng'}
                disabled={busy || available.length === 0}
              />
            </Box>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Số tiền"
              containerClassName="w-32"
            />
            <Button type="button" variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />} disabled={busy || !txId} onClick={handleAdd}>
              Gắn
            </Button>
          </Box>

          {/* Chốt "đã khớp dù lệch" — không bắt buộc gắn đủ 100% */}
          {canForce ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Check className="h-4 w-4 text-amber-500" />}
              disabled={busy}
              onClick={() => handleForce(true)}
            >
              Đánh dấu đã khớp (lệch {formatVND(remaining)})
            </Button>
          ) : null}

          {/* Đang ở trạng thái khớp-dù-lệch → cảnh báo + cho phép bỏ đánh dấu */}
          {forced ? (
            <Box layoutClassName="flex items-center justify-between gap-2">
              <Box layoutClassName="flex min-w-0 items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <Typography size="xs" textClassName="text-amber-600 dark:text-amber-400">
                  Đã chốt khớp{diff !== 0 ? <> dù lệch {formatVND(Math.abs(diff))} {diff < 0 ? 'thiếu' : 'dư'}</> : null}.
                </Typography>
              </Box>
              <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => handleForce(false)}>
                Bỏ đánh dấu
              </Button>
            </Box>
          ) : null}
        </>
      )}
    </Box>
  );
};

export default AllocationPanel;

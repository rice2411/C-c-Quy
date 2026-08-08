import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Coins, GitCompareArrows, Inbox, Link2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { LedgerFilters, LedgerTransaction } from '@/types';
import { useLedger } from '@/hooks/queries/useTransactionsQuery';
import {
  reconcileTransactionsPreview,
  reconcileTransactionsApply,
  expenseReconcilePreview,
  expenseReconcileApply,
  type ReconcilePreviewResult,
  type ExpenseReconcilePreviewResult,
} from '@/services/transactionService';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import Typography from '@/components/ui/Typography';
import LedgerDesktopTable from './components/ledger/LedgerDesktopTable';
import LedgerMobileList from './components/ledger/LedgerMobileList';
import ReconcileSyncModal from './components/ReconcileSyncModal';
import ExpenseReconcileSyncModal from './components/ExpenseReconcileSyncModal';
import ReconcileActionModal from './components/ReconcileActionModal';

const PAGE_SIZE = 50;

const formatDate = (dateStr: string): string => {
  try {
    const d = new Date((dateStr || '').replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
};

/**
 * Cần đối soát — bảng giao dịch vào/ra ĐƠN GIẢN + filter "chưa khớp".
 * Click 1 dòng → modal chọn đối soát (vào↔đơn, ra↔phiếu nhập/chi phí).
 * Giữ 2 nút đồng bộ hàng loạt (gợi ý 1-1 auto) ở trên cùng.
 */
const ReconciliationTab: React.FC<{ fromDate: string; toDate: string }> = ({ fromDate, toDate }) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [type, setType] = useState<LedgerFilters['type']>('');
  const [onlyUnmatched, setOnlyUnmatched] = useState(true);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<LedgerTransaction | null>(null);

  // bulk: GD ↔ đơn
  const [syncOpen, setSyncOpen] = useState(false);
  const [syncPreview, setSyncPreview] = useState<ReconcilePreviewResult | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncApplying, setSyncApplying] = useState(false);
  // bulk: tiền ra ↔ chi phí
  const [expOpen, setExpOpen] = useState(false);
  const [expPreview, setExpPreview] = useState<ExpenseReconcilePreviewResult | null>(null);
  const [expLoading, setExpLoading] = useState(false);
  const [expApplying, setExpApplying] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => { setPage(0); }, [debouncedSearch, type, onlyUnmatched, fromDate, toDate]);

  const filters = useMemo<LedgerFilters>(() => ({
    from: fromDate,
    to: toDate ? `${toDate.slice(0, 10)} 23:59:59` : '',
    type,
    status: onlyUnmatched ? 'unmatched' : '',
    category: '',
    gateway: '',
    search: debouncedSearch,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  }), [fromDate, toDate, type, onlyUnmatched, debouncedSearch, page]);

  const { data, loading, isFetching, error, refetch } = useLedger(filters);

  useEffect(() => { if (error) toast.error('Không tải được giao dịch'); }, [error]);

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  const fromIdx = data.total === 0 ? 0 : page * PAGE_SIZE + 1;
  const toIdx = Math.min((page + 1) * PAGE_SIZE, data.total);

  // ---- bulk handlers ----
  const openSync = async () => {
    setSyncOpen(true); setSyncPreview(null); setSyncLoading(true);
    try { setSyncPreview(await reconcileTransactionsPreview()); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Không quét được'); setSyncOpen(false); }
    finally { setSyncLoading(false); }
  };
  const confirmSync = async () => {
    if (!syncPreview?.matched.length) return;
    setSyncApplying(true);
    try {
      const { applied, skipped } = await reconcileTransactionsApply(syncPreview.matched);
      toast.success(`Đã khớp ${applied}${skipped ? ` · bỏ qua ${skipped}` : ''}`);
      await refetch(); setSyncOpen(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Khớp thất bại'); }
    finally { setSyncApplying(false); }
  };
  const openExp = async () => {
    setExpOpen(true); setExpPreview(null); setExpLoading(true);
    try { setExpPreview(await expenseReconcilePreview()); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Không quét được'); setExpOpen(false); }
    finally { setExpLoading(false); }
  };
  const confirmExp = async () => {
    if (!expPreview?.matched.length) return;
    setExpApplying(true);
    try {
      const pairs = expPreview.matched.map((m) => ({ transactionId: m.transactionId, expenseId: m.expenseId }));
      const { applied, skipped } = await expenseReconcileApply(pairs);
      toast.success(`Đã khớp ${applied}${skipped ? ` · bỏ qua ${skipped}` : ''}`);
      await refetch(); setExpOpen(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Khớp thất bại'); }
    finally { setExpApplying(false); }
  };

  return (
    <Box layoutClassName="space-y-4">
      {/* Header + nút đồng bộ hàng loạt */}
      <Box layoutClassName="flex flex-wrap items-center justify-between gap-2">
        <Typography size="sm" variant="muted">
          Click 1 giao dịch để chọn đối soát. Hoặc dùng đồng bộ tự động (gợi ý cặp 1-1).
        </Typography>
        <Box layoutClassName="flex items-center gap-2">
          <Button type="button" variant="secondary" sizeClassName="px-3 py-2 text-xs" layoutClassName="inline-flex items-center gap-1.5"
            leftIcon={<GitCompareArrows className="h-4 w-4" />} onClick={openSync}>
            Đồng bộ với đơn
          </Button>
          <Button type="button" variant="secondary" sizeClassName="px-3 py-2 text-xs" layoutClassName="inline-flex items-center gap-1.5"
            leftIcon={<Coins className="h-4 w-4" />} onClick={openExp}>
            Đồng bộ chi phí
          </Button>
        </Box>
      </Box>

      {/* Filter đơn giản */}
      <Box layoutClassName="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Box layoutClassName="min-w-0 flex-1 sm:min-w-[200px]">
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm nội dung, mã đơn, số TK..." leftIcon={<Search className="h-4 w-4 text-slate-400" />} roundedClassName="rounded-lg" />
        </Box>
        <Select size="sm" value={type || ''} onChange={(e) => setType((e.target.value || '') as LedgerFilters['type'])}
          layoutClassName="w-full rounded-lg sm:w-auto" sizeClassName="px-3">
          <option value="">Tất cả loại</option>
          <option value="in">Tiền vào</option>
          <option value="out">Tiền ra</option>
        </Select>
        <Button type="button" onClick={() => setOnlyUnmatched((v) => !v)} variant="ghost"
          disableVariantHover disableVariantTextColor roundedClassName="rounded-lg" sizeClassName="px-3 py-2 text-xs"
          layoutClassName="inline-flex items-center gap-1.5" borderClassName="border border-slate-200 dark:border-slate-600"
          backgroundClassName={onlyUnmatched ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-white dark:bg-slate-800'}
          textClassName={onlyUnmatched ? 'font-semibold text-amber-700 dark:text-amber-300' : 'font-medium text-slate-500 dark:text-slate-400'}>
          <Link2 className="h-3.5 w-3.5" /> Chỉ chưa khớp
        </Button>
      </Box>

      {loading ? (
        <Box layoutClassName="flex flex-1 items-center justify-center py-16"><Spinner size="lg" textClassName="text-primary-500" /></Box>
      ) : data.items.length === 0 ? (
        <Box layoutClassName="flex flex-col items-center justify-center gap-3 py-16" textClassName="text-slate-400 dark:text-slate-500">
          <Box layoutClassName="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <Inbox className="h-8 w-8 opacity-40" />
          </Box>
          <Typography size="sm" variant="muted">
            {onlyUnmatched ? 'Không còn giao dịch nào chưa khớp 🎉' : 'Không có giao dịch phù hợp'}
          </Typography>
        </Box>
      ) : (
        <>
          <LedgerMobileList transactions={data.items} formatDate={formatDate} onRowClick={setSelected} />
          <LedgerDesktopTable transactions={data.items} formatDate={formatDate} onRowClick={setSelected} />

          <Card padding="none" layoutClassName="flex items-center justify-between gap-3 px-4 py-3"
            backgroundClassName="bg-white dark:bg-slate-800" borderClassName="border-slate-100 dark:border-slate-700">
            <Typography as="span" size="xs" variant="muted">{fromIdx}–{toIdx} / {data.total} giao dịch</Typography>
            <Box layoutClassName="flex items-center gap-2">
              <Button type="button" variant="ghost" disableVariantHover disableVariantTextColor disabled={page === 0 || isFetching}
                onClick={() => setPage((p) => Math.max(0, p - 1))} layoutClassName="flex items-center gap-1" roundedClassName="rounded-lg"
                sizeClassName="px-2.5 py-1.5 text-xs" borderClassName="border border-slate-200 dark:border-slate-600"
                backgroundClassName="bg-white dark:bg-slate-700" textClassName="font-medium text-slate-600 dark:text-slate-300"
                stateClassName="transition-colors disabled:opacity-40">
                <ChevronLeft className="h-3.5 w-3.5" /> Trước
              </Button>
              <Typography as="span" size="xs" layoutClassName="font-semibold" textClassName="text-slate-700 dark:text-slate-200">{page + 1}/{totalPages}</Typography>
              <Button type="button" variant="ghost" disableVariantHover disableVariantTextColor disabled={page + 1 >= totalPages || isFetching}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} layoutClassName="flex items-center gap-1" roundedClassName="rounded-lg"
                sizeClassName="px-2.5 py-1.5 text-xs" borderClassName="border border-slate-200 dark:border-slate-600"
                backgroundClassName="bg-white dark:bg-slate-700" textClassName="font-medium text-slate-600 dark:text-slate-300"
                stateClassName="transition-colors disabled:opacity-40">
                Sau <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Box>
          </Card>
        </>
      )}

      {/* Modal chọn đối soát cho 1 GD */}
      <ReconcileActionModal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        transaction={selected}
        onChanged={() => { void refetch(); }}
      />

      {/* Bulk modals */}
      <ReconcileSyncModal isOpen={syncOpen} onClose={() => setSyncOpen(false)} preview={syncPreview} loading={syncLoading} applying={syncApplying} onConfirm={confirmSync} />
      <ExpenseReconcileSyncModal isOpen={expOpen} onClose={() => setExpOpen(false)} preview={expPreview} loading={expLoading} applying={expApplying} onConfirm={confirmExp} />
    </Box>
  );
};

export default ReconciliationTab;

import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  Link2,
  Link2Off,
  Loader2,
  Square,
} from 'lucide-react';
import { formatVND } from '@/utils/format/currencyUtil';
import {
  fetchReceiptsForReconcile,
  fetchUnlinkedOutTxns,
  reconcileReceipt,
  stockReceiptReconcileApply,
  stockReceiptReconcilePreview,
  unreconcileReceipt,
  type ReceiptReconcileMatch,
  type ReceiptReconcilePreview,
  type ReconcileReceiptItem,
  type UnlinkedOutTxn,
} from '@/services/stockReceiptService';
import BaseModal from '@/components/BaseModal';
import Box from '@/components/ui/Box';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';
import Tabs from '@/components/ui/Tabs';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Gọi sau khi có thay đổi đối soát (để parent refetch danh sách phiếu). */
  onApplied?: () => void;
}

const fmtDate = (v?: string | null): string => {
  if (!v) return '—';
  const d = new Date(v.length <= 10 ? `${v}T00:00:00` : v);
  return Number.isNaN(d.getTime())
    ? v
    : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const pairKey = (m: { receiptId: string; transactionId: string }): string =>
  `${m.receiptId}|${m.transactionId}`;

const dayMs = 86400000;
const dateGap = (a?: string | null, b?: string | null): number => {
  if (!a || !b) return 9999;
  const da = new Date(a.slice(0, 10)).getTime();
  const db = new Date(b.slice(0, 10)).getTime();
  if (Number.isNaN(da) || Number.isNaN(db)) return 9999;
  return Math.round(Math.abs(da - db) / dayMs);
};

const ReceiptReconcileModal: React.FC<Props> = ({ isOpen, onClose, onApplied }) => {
  const [tab, setTab] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [preview, setPreview] = useState<ReceiptReconcilePreview | null>(null);
  const [receipts, setReceipts] = useState<ReconcileReceiptItem[]>([]);
  const [txns, setTxns] = useState<UnlinkedOutTxn[]>([]);
  // auto tab: các cặp đang chọn (key = receiptId|transactionId) để áp
  const [picked, setPicked] = useState<Set<string>>(new Set());
  // manual tab
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [txSearch, setTxSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [pv, rc, tx] = await Promise.all([
        stockReceiptReconcilePreview(),
        fetchReceiptsForReconcile(),
        fetchUnlinkedOutTxns(),
      ]);
      setPreview(pv);
      setReceipts(rc);
      setTxns(tx);
      // mặc định chỉ tick sẵn cặp 1-1 (an toàn); cặp mập mờ để user tự chọn.
      setPicked(new Set(pv.matched.filter((m) => m.txCand === 1 && m.receiptCand === 1).map(pairKey)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không tải được dữ liệu đối soát.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTab('auto');
      setSelectedReceiptId(null);
      setTxSearch('');
      void loadAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const matched = preview?.matched ?? [];
  const pickedPairs = useMemo(
    () => matched.filter((m) => picked.has(pairKey(m))),
    [matched, picked],
  );

  // Chọn/bỏ 1 cặp. Khi chọn → tự bỏ mọi cặp khác dùng CHUNG GD hoặc CHUNG phiếu (tránh gắn trùng).
  const togglePick = (m: ReceiptReconcileMatch) =>
    setPicked((prev) => {
      const key = pairKey(m);
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        return next;
      }
      for (const other of matched) {
        const ok = pairKey(other);
        if (ok !== key && (other.transactionId === m.transactionId || other.receiptId === m.receiptId)) {
          next.delete(ok);
        }
      }
      next.add(key);
      return next;
    });

  const applyAuto = async () => {
    if (pickedPairs.length === 0) return;
    setApplying(true);
    try {
      const r = await stockReceiptReconcileApply(
        pickedPairs.map((m) => ({ receiptId: m.receiptId, transactionId: m.transactionId })),
      );
      toast.success(`Đã khớp ${r.applied} cặp${r.skipped ? ` · bỏ qua ${r.skipped}` : ''}.`);
      onApplied?.();
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Áp dụng thất bại.');
    } finally {
      setApplying(false);
    }
  };

  // ----- manual -----
  const unreconciledReceipts = useMemo(
    () => receipts.filter((r) => !r.reconciled),
    [receipts],
  );
  const reconciledReceipts = useMemo(
    () => receipts.filter((r) => r.reconciled),
    [receipts],
  );
  const selectedReceipt = useMemo(
    () => receipts.find((r) => r.receiptId === selectedReceiptId) ?? null,
    [receipts, selectedReceiptId],
  );

  const candidates = useMemo(() => {
    if (!selectedReceipt) return [];
    const amt = selectedReceipt.totalAmount ?? 0;
    const q = txSearch.trim().toLowerCase();
    return [...txns]
      .filter((t) => !q || (t.content ?? '').toLowerCase().includes(q) || String(t.amount).includes(q))
      .map((t) => ({
        t,
        amtDiff: Math.abs((t.amount ?? 0) - amt),
        gap: dateGap(t.transactionDate, selectedReceipt.receiptDate),
      }))
      .sort((a, b) => a.amtDiff - b.amtDiff || a.gap - b.gap)
      .slice(0, 30);
  }, [selectedReceipt, txns, txSearch]);

  const linkManual = async (receiptId: string, transactionId: string) => {
    setBusyId(receiptId);
    try {
      await reconcileReceipt(receiptId, transactionId);
      toast.success('Đã gắn giao dịch cho phiếu.');
      onApplied?.();
      setSelectedReceiptId(null);
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gắn thất bại.');
    } finally {
      setBusyId(null);
    }
  };

  const unlinkManual = async (receiptId: string) => {
    setBusyId(receiptId);
    try {
      await unreconcileReceipt(receiptId);
      toast.success('Đã gỡ đối soát.');
      onApplied?.();
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gỡ thất bại.');
    } finally {
      setBusyId(null);
    }
  };

  const footer =
    tab === 'auto' ? (
      <Box layoutClassName="flex items-center justify-between gap-2">
        <Typography size="xs" variant="muted">
          Đã chọn {pickedPairs.length}/{matched.length} cặp
        </Typography>
        <Box layoutClassName="flex items-center gap-2">
          <Button type="button" variant="secondary" sizeClassName="px-4 py-2 text-sm" disabled={applying} onClick={onClose}>
            Đóng
          </Button>
          <Button
            type="button"
            variant="primary"
            sizeClassName="px-4 py-2 text-sm"
            layoutClassName="inline-flex items-center gap-2"
            disabled={pickedPairs.length === 0 || applying || loading}
            onClick={applyAuto}
          >
            {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {applying ? 'Đang khớp…' : `Áp dụng ${pickedPairs.length ? `(${pickedPairs.length})` : ''}`}
          </Button>
        </Box>
      </Box>
    ) : (
      <Box layoutClassName="flex justify-end">
        <Button type="button" variant="secondary" sizeClassName="px-4 py-2 text-sm" onClick={onClose}>
          Đóng
        </Button>
      </Box>
    );

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Đối soát phiếu nhập ↔ tiền ra" footer={footer} size="xl">
      <Tabs
        items={[
          { id: 'auto', label: `Gợi ý tự động${matched.length ? ` (${matched.length})` : ''}` },
          { id: 'manual', label: `Khớp tay${unreconciledReceipts.length ? ` (${unreconciledReceipts.length})` : ''}` },
        ]}
        value={tab}
        onChange={setTab}
      />

      {loading ? (
        <Box layoutClassName="flex flex-col items-center justify-center gap-3 py-16">
          <Spinner size="lg" textClassName="text-primary-500" />
          <Typography size="sm" variant="muted">Đang quét giao dịch + phiếu nhập…</Typography>
        </Box>
      ) : tab === 'auto' ? (
        <Box layoutClassName="space-y-4 pt-4">
          <Box layoutClassName="flex flex-wrap items-center gap-2">
            <Badge size="sm" backgroundClassName="bg-emerald-100 dark:bg-emerald-900/30" textClassName="font-semibold text-emerald-700 dark:text-emerald-300">
              {preview?.uniqueCount ?? 0} cặp 1-1
            </Badge>
            <Badge size="sm" backgroundClassName="bg-amber-100 dark:bg-amber-900/30" textClassName="font-semibold text-amber-700 dark:text-amber-300">
              {preview?.ambiguousCount ?? 0} nhiều ứng viên
            </Badge>
            <Badge size="sm" backgroundClassName="bg-slate-100 dark:bg-slate-700" textClassName="font-semibold text-slate-600 dark:text-slate-300">
              {preview?.totalUnlinkedReceipt ?? 0} phiếu chưa gắn
            </Badge>
          </Box>
          <Typography size="xs" variant="muted">
            Gợi ý theo SỐ TIỀN bằng nhau. Cặp 1-1 đã tick sẵn; cặp "nhiều ứng viên" hãy tự chọn đúng phiếu (chọn 1 cặp sẽ tự bỏ cặp khác cùng giao dịch/phiếu).
          </Typography>

          {matched.length > 0 ? (
            <Box layoutClassName="max-h-[52vh] space-y-2 overflow-y-auto">
              {matched.map((m) => {
                const on = picked.has(pairKey(m));
                const ambiguous = m.txCand > 1 || m.receiptCand > 1;
                const gapLabel =
                  m.dateGap === null ? 'thiếu ngày' : m.dateGap === 0 ? 'cùng ngày' : `lệch ${m.dateGap}n`;
                const gapWarn = m.dateGap === null || (m.dateGap ?? 0) > 31;
                return (
                  <Box
                    key={pairKey(m)}
                    role="button"
                    tabIndex={0}
                    onClick={() => togglePick(m)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePick(m); }
                    }}
                    layoutClassName="flex cursor-pointer items-center gap-3 rounded-xl border p-3"
                    borderClassName={on ? 'border-primary-300 dark:border-primary-700' : 'border-slate-100 dark:border-slate-700'}
                    backgroundClassName={on ? 'bg-primary-50/50 dark:bg-primary-900/10' : 'bg-white dark:bg-slate-800'}
                  >
                    {on ? (
                      <CheckSquare className="h-5 w-5 shrink-0 text-primary-500" />
                    ) : (
                      <Square className="h-5 w-5 shrink-0 text-slate-300 dark:text-slate-600" />
                    )}
                    <Box layoutClassName="min-w-0 flex-1">
                      <Typography as="p" size="sm" layoutClassName="font-semibold" textClassName="text-rose-600 dark:text-rose-400">
                        −{formatVND(m.amount)}
                      </Typography>
                      <Typography as="p" size="xs" layoutClassName="truncate" textClassName="text-slate-400 dark:text-slate-500">
                        {fmtDate(m.transactionDate)} · {m.gateway || 'GD'} · {m.description || '—'}
                      </Typography>
                    </Box>
                    <Box layoutClassName="flex shrink-0 flex-col items-center gap-1">
                      <ArrowRight className="h-4 w-4 text-slate-300 dark:text-slate-500" />
                      <Typography as="span" size="xs" textClassName={gapWarn ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}>
                        {gapLabel}
                      </Typography>
                    </Box>
                    <Box layoutClassName="min-w-0 flex-1 text-right">
                      <Typography as="p" size="sm" layoutClassName="truncate font-semibold" textClassName="text-primary-600 dark:text-primary-400">
                        {m.supplier || 'Phiếu nhập'}
                      </Typography>
                      <Typography as="p" size="xs" layoutClassName="truncate" textClassName="text-slate-400 dark:text-slate-500">
                        {fmtDate(m.receiptDate)}{m.invoiceNumber ? ` · ${m.invoiceNumber}` : ''}
                      </Typography>
                      {ambiguous ? (
                        <Badge size="sm" layoutClassName="mt-0.5 inline-flex" backgroundClassName="bg-amber-100 dark:bg-amber-900/30" textClassName="text-amber-700 dark:text-amber-300">
                          nhiều ứng viên
                        </Badge>
                      ) : null}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ) : (
            <EmptyState
              icon={<CheckCircle2 className="h-6 w-6" />}
              title="Không có phiếu nào trùng số tiền với giao dịch tiền ra. Thử tab Khớp tay."
            />
          )}
        </Box>
      ) : (
        // ----- MANUAL -----
        <Box layoutClassName="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
          {/* Trái: phiếu chưa đối soát */}
          <Box layoutClassName="space-y-2">
            <Typography size="xs" layoutClassName="font-semibold uppercase" textClassName="text-slate-500 dark:text-slate-400">
              Phiếu chưa đối soát ({unreconciledReceipts.length})
            </Typography>
            <Box layoutClassName="max-h-[46vh] space-y-1.5 overflow-y-auto">
              {unreconciledReceipts.length === 0 ? (
                <EmptyState title="Mọi phiếu đã đối soát 🎉" />
              ) : (
                unreconciledReceipts.map((r) => {
                  const on = r.receiptId === selectedReceiptId;
                  return (
                    <Box
                      key={r.receiptId}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedReceiptId(r.receiptId)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedReceiptId(r.receiptId); }
                      }}
                      layoutClassName="cursor-pointer rounded-lg border p-2.5"
                      borderClassName={on ? 'border-primary-400 dark:border-primary-600' : 'border-slate-100 dark:border-slate-700'}
                      backgroundClassName={on ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-white dark:bg-slate-800'}
                    >
                      <Box layoutClassName="flex items-center justify-between gap-2">
                        <Typography as="span" size="sm" layoutClassName="truncate font-medium">
                          {r.supplierName || 'Không rõ NCC'}
                        </Typography>
                        <Typography as="span" size="sm" layoutClassName="shrink-0 font-bold tabular-nums" textClassName="text-primary-700 dark:text-primary-300">
                          {formatVND(r.totalAmount ?? 0)}
                        </Typography>
                      </Box>
                      <Typography size="xs" variant="muted">
                        {fmtDate(r.receiptDate)}{r.invoiceNumber ? ` · ${r.invoiceNumber}` : ''}
                      </Typography>
                    </Box>
                  );
                })
              )}
            </Box>

            {reconciledReceipts.length > 0 ? (
              <Box layoutClassName="space-y-1.5 pt-2">
                <Typography size="xs" layoutClassName="font-semibold uppercase" textClassName="text-slate-500 dark:text-slate-400">
                  Đã đối soát ({reconciledReceipts.length})
                </Typography>
                {reconciledReceipts.slice(0, 10).map((r) => (
                  <Box
                    key={r.receiptId}
                    layoutClassName="flex items-center justify-between gap-2 rounded-lg border p-2"
                    borderClassName="border-emerald-100 dark:border-emerald-900/40"
                    backgroundClassName="bg-emerald-50/40 dark:bg-emerald-900/10"
                  >
                    <Box layoutClassName="min-w-0">
                      <Typography as="p" size="xs" layoutClassName="truncate font-medium">
                        {r.supplierName || 'NCC'} · {formatVND(r.totalAmount ?? 0)}
                      </Typography>
                    </Box>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={busyId === r.receiptId}
                      leftIcon={<Link2Off className="h-3.5 w-3.5" />}
                      onClick={() => unlinkManual(r.receiptId)}
                    >
                      Gỡ
                    </Button>
                  </Box>
                ))}
              </Box>
            ) : null}
          </Box>

          {/* Phải: giao dịch ứng viên cho phiếu đang chọn */}
          <Box layoutClassName="space-y-2">
            {!selectedReceipt ? (
              <EmptyState title="Chọn 1 phiếu bên trái để tìm giao dịch khớp." />
            ) : (
              <>
                <Box layoutClassName="rounded-lg border p-2.5" borderClassName="border-slate-200 dark:border-slate-700" backgroundClassName="bg-slate-50 dark:bg-slate-800/60">
                  <Typography size="xs" variant="muted">Đang khớp cho phiếu:</Typography>
                  <Typography size="sm" layoutClassName="font-semibold">
                    {selectedReceipt.supplierName || 'NCC'} · {formatVND(selectedReceipt.totalAmount ?? 0)} · {fmtDate(selectedReceipt.receiptDate)}
                  </Typography>
                </Box>
                <Input
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  placeholder="Tìm GD theo nội dung / số tiền…"
                />
                <Box layoutClassName="max-h-[38vh] space-y-1.5 overflow-y-auto">
                  {candidates.length === 0 ? (
                    <EmptyState title="Không có giao dịch tiền ra phù hợp." />
                  ) : (
                    candidates.map(({ t, amtDiff, gap }) => (
                      <Box
                        key={t.id}
                        layoutClassName="flex items-center justify-between gap-2 rounded-lg border p-2.5"
                        borderClassName={amtDiff === 0 ? 'border-emerald-200 dark:border-emerald-800' : 'border-slate-100 dark:border-slate-700'}
                        backgroundClassName="bg-white dark:bg-slate-800"
                      >
                        <Box layoutClassName="min-w-0 flex-1">
                          <Box layoutClassName="flex items-center gap-2">
                            <Typography as="span" size="sm" layoutClassName="font-semibold" textClassName="text-rose-600 dark:text-rose-400">
                              −{formatVND(t.amount)}
                            </Typography>
                            {amtDiff === 0 ? (
                              <Badge size="sm" backgroundClassName="bg-emerald-100 dark:bg-emerald-900/30" textClassName="text-emerald-700 dark:text-emerald-300">
                                đúng tiền
                              </Badge>
                            ) : null}
                          </Box>
                          <Typography as="p" size="xs" layoutClassName="truncate" textClassName="text-slate-400 dark:text-slate-500">
                            {fmtDate(t.transactionDate)} · {t.gateway || 'GD'} · {t.content || '—'}
                            {gap < 9999 ? ` · lệch ${gap}n` : ''}
                          </Typography>
                        </Box>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          disabled={busyId === selectedReceipt.receiptId}
                          leftIcon={<Link2 className="h-3.5 w-3.5" />}
                          onClick={() => linkManual(selectedReceipt.receiptId, t.id)}
                        >
                          Gắn
                        </Button>
                      </Box>
                    ))
                  )}
                </Box>
              </>
            )}
          </Box>
        </Box>
      )}
    </BaseModal>
  );
};

export default ReceiptReconcileModal;

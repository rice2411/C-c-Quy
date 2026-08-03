import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Copy, FileSpreadsheet, Truck, Upload, Wallet, XCircle } from 'lucide-react';
import {
  syncOrderTracking, TrackingRow, TrackingSyncResult,
  syncOrderCod, CodRow, CodSyncResult,
} from '@/services/orderService';
import { formatVND } from '@/utils/format/currencyUtil';
import BaseModal from '@/components/BaseModal';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Gọi sau khi áp thành công để refetch danh sách đơn. */
  onApplied: () => void;
}

/** Tìm cột theo tên header — không phân biệt hoa thường/khoảng trắng. */
const findCol = (header: any[], ...names: string[]): number => {
  const norm = (s: any) => String(s ?? '').trim().toLowerCase();
  const wanted = names.map(norm);
  return header.findIndex((c) => wanted.includes(norm(c)));
};

/** "+255.000" / "+255000" / "-660,000" → number (đã bỏ dấu +, phân cách nghìn). */
const parseAmount = (v: any): number => {
  const n = Number(String(v ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const PAY_STATUS_VI: Record<string, string> = {
  PAID: 'Đã thanh toán',
  DEPOSITED: 'Đã cọc',
  UNPAID: 'Chưa thanh toán',
  REFUNDED: 'Đã hoàn tiền',
};

type Mode = 'tracking' | 'cod';

const TrackingImportModal: React.FC<Props> = ({ isOpen, onClose, onApplied }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [mode, setMode] = useState<Mode | null>(null);
  const [trackRows, setTrackRows] = useState<TrackingRow[]>([]);
  const [codRows, setCodRows] = useState<CodRow[]>([]);
  const [trackPreview, setTrackPreview] = useState<TrackingSyncResult | null>(null);
  const [codPreview, setCodPreview] = useState<CodSyncResult | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setFileName(''); setMode(null);
    setTrackRows([]); setCodRows([]);
    setTrackPreview(null); setCodPreview(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    reset();
    setFileName(file.name);
    setBusy(true);
    try {
      // Nạp XLSX (~849KB) theo yêu cầu — chỉ tải khi user thật sự chọn file.
      const XLSX = await import('xlsx-js-style');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const grid = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, blankrows: false });

      // ── Tự nhận diện loại file SPX ──
      const trackHIdx = grid.findIndex((r) => findCol(r, 'Tracking No.') >= 0);
      const codHIdx = grid.findIndex(
        (r) => findCol(r, 'Loại giao dịch') >= 0 && findCol(r, 'Mã vận đơn') >= 0,
      );

      if (trackHIdx >= 0) {
        await parseTracking(grid, trackHIdx);
      } else if (codHIdx >= 0) {
        await parseCod(grid, codHIdx);
      } else {
        throw new Error(
          'File không đúng định dạng SPX. Cần file vận đơn (cột "Tracking No.") ' +
          'hoặc file giao dịch ví (cột "Loại giao dịch" + "Mã vận đơn").',
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Đọc file thất bại');
      reset();
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  // ── File vận đơn (khớp theo SĐT) ──
  const parseTracking = async (grid: any[][], hIdx: number) => {
    const header = grid[hIdx];
    const cTrack = findCol(header, 'Tracking No.');
    const cLink = findCol(header, 'Tracking No. link');
    const cStatus = findCol(header, 'Tracking Status');
    const cName = findCol(header, 'Receiver Name');
    const cPhone = findCol(header, 'Receiver Phone Number');
    const cRef = findCol(header, 'Customer Reference No.'); // = mã đơn ORD-xxxxx
    const cCreate = findCol(header, 'Create Time');
    const parsed: TrackingRow[] = [];
    for (let i = hIdx + 1; i < grid.length; i++) {
      const r = grid[i];
      const tracking = String(r[cTrack] ?? '').trim();
      if (!tracking || tracking.toLowerCase().includes('mã vận đơn')) continue;
      const ref = cRef >= 0 ? String(r[cRef] ?? '').trim() : '';
      parsed.push({
        tracking,
        link: cLink >= 0 ? String(r[cLink] ?? '').trim() : undefined,
        status: cStatus >= 0 ? String(r[cStatus] ?? '').trim() : undefined,
        name: cName >= 0 ? String(r[cName] ?? '').trim() : undefined,
        phone: cPhone >= 0 ? String(r[cPhone] ?? '').trim() : undefined,
        orderRef: ref && ref !== '-' ? ref : undefined,
        createTime: cCreate >= 0 ? String(r[cCreate] ?? '').trim() : undefined,
      });
    }
    if (parsed.length === 0) throw new Error('Không đọc được dòng vận đơn nào.');
    setMode('tracking');
    setTrackRows(parsed);
    setTrackPreview(await syncOrderTracking(parsed, false));
  };

  // ── File giao dịch ví (khớp COD theo mã vận đơn) ──
  const parseCod = async (grid: any[][], hIdx: number) => {
    const header = grid[hIdx];
    const cTx = findCol(header, 'Mã giao dịch');
    const cType = findCol(header, 'Loại giao dịch');
    const cTrack = findCol(header, 'Mã vận đơn');
    const cAmount = findCol(header, 'Số tiền (VND)', 'Số tiền');
    const cDate = findCol(header, 'Thời gian giao dịch');
    if (cTx < 0 || cTrack < 0 || cAmount < 0) {
      throw new Error('File ví SPX thiếu cột Mã giao dịch / Mã vận đơn / Số tiền.');
    }
    const parsed: CodRow[] = [];
    for (let i = hIdx + 1; i < grid.length; i++) {
      const r = grid[i];
      const type = String(r[cType] ?? '').trim().toLowerCase();
      const tracking = String(r[cTrack] ?? '').trim();
      // Chỉ lấy dòng THU HỘ có mã vận đơn SPXVN (bỏ dòng rút tiền, điều chỉnh…).
      if (!type.includes('thu hộ')) continue;
      if (!tracking.toUpperCase().startsWith('SPXVN')) continue;
      const amount = parseAmount(r[cAmount]);
      if (amount <= 0) continue;
      parsed.push({
        txId: String(r[cTx] ?? '').trim(),
        tracking,
        amount,
        date: cDate >= 0 ? String(r[cDate] ?? '').trim() : undefined,
      });
    }
    if (parsed.length === 0) throw new Error('Không thấy dòng "Tiền thu hộ" nào có mã SPXVN.');
    setMode('cod');
    setCodRows(parsed);
    setCodPreview(await syncOrderCod(parsed, false));
  };

  const handleApplyTracking = async () => {
    if (!trackRows.length) return;
    setBusy(true);
    try {
      const res = await syncOrderTracking(trackRows, true);
      const extra = (res.cancelledCount ?? 0) > 0 ? ` · ${res.cancelledCount} mã huỷ` : '';
      toast.success(`Đã đồng bộ ${res.matchedCount} vận đơn${extra}`);
      onApplied();
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Đồng bộ thất bại');
    } finally {
      setBusy(false);
    }
  };

  const handleApplyCod = async () => {
    if (!codRows.length) return;
    setBusy(true);
    try {
      const res = await syncOrderCod(codRows, true);
      const sum = res.matched.reduce((s, m) => s + m.amount, 0);
      toast.success(`Đã ghi nhận thu hộ ${res.matchedCount} đơn · ${formatVND(sum)}`);
      onApplied();
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Đồng bộ thất bại');
    } finally {
      setBusy(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Đồng bộ từ file SPX (vận đơn / thu hộ COD)" size="lg">
      <Box layoutClassName="space-y-4">
        <Typography as="p" size="sm" variant="muted">
          Tải file Excel xuất từ SPX. Hệ thống <b>tự nhận diện</b>: file <b>vận đơn</b> → khớp theo SĐT
          rồi gán mã vận đơn; file <b>giao dịch ví</b> → lấy dòng "Tiền thu hộ", khớp theo mã vận đơn và
          cộng tiền COD vào đơn (đơn cọc trước sẽ tự chuyển sang <b>đã thanh toán</b>).
        </Typography>

        {/* File picker */}
        <Box layoutClassName="flex items-center gap-3">
          <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
          <Button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            variant="secondary"
            leftIcon={<Upload />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
            sizeClassName="px-3 py-2 text-sm"
            roundedClassName="rounded-lg"
            borderClassName="border border-slate-200 dark:border-slate-600"
            backgroundClassName="bg-white dark:bg-slate-800"
            layoutClassName="inline-flex items-center gap-1.5"
          >
            Chọn file Excel
          </Button>
          {fileName ? (
            <Typography as="span" size="sm" layoutClassName="inline-flex items-center gap-1.5 truncate" variant="muted">
              <FileSpreadsheet className="h-4 w-4 shrink-0 text-primary-500" /> {fileName}
              {mode === 'cod' ? (
                <Typography as="span" size="xs" layoutClassName="inline-flex items-center gap-1" textClassName="text-amber-600 dark:text-amber-400">
                  <Wallet className="h-3.5 w-3.5" /> thu hộ COD
                </Typography>
              ) : mode === 'tracking' ? (
                <Typography as="span" size="xs" layoutClassName="inline-flex items-center gap-1" textClassName="text-sky-600 dark:text-sky-400">
                  <Truck className="h-3.5 w-3.5" /> vận đơn
                </Typography>
              ) : null}
            </Typography>
          ) : null}
        </Box>

        {busy && !trackPreview && !codPreview ? (
          <Typography as="p" size="sm" variant="muted">Đang đọc file + đối chiếu…</Typography>
        ) : null}

        {/* ── Preview: VẬN ĐƠN ── */}
        {mode === 'tracking' && trackPreview ? (
          <Box layoutClassName="space-y-3">
            <Box layoutClassName="flex flex-wrap gap-4">
              <Typography as="span" size="sm" layoutClassName="inline-flex items-center gap-1.5 font-semibold" textClassName="text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Khớp {trackPreview.matchedCount} đơn
              </Typography>
              <Typography as="span" size="sm" layoutClassName="inline-flex items-center gap-1.5 font-semibold" textClassName="text-amber-600 dark:text-amber-400">
                <Copy className="h-4 w-4" /> Đã có vận đơn {trackPreview.skippedCount}
              </Typography>
              {(trackPreview.cancelledCount ?? 0) > 0 ? (
                <Typography as="span" size="sm" layoutClassName="inline-flex items-center gap-1.5 font-semibold" textClassName="text-orange-600 dark:text-orange-400">
                  <XCircle className="h-4 w-4" /> Mã bị huỷ {trackPreview.cancelledCount}
                </Typography>
              ) : null}
              <Typography as="span" size="sm" layoutClassName="inline-flex items-center gap-1.5 font-semibold" textClassName="text-rose-500 dark:text-rose-400">
                <XCircle className="h-4 w-4" /> Không khớp {trackPreview.unmatchedCount}
              </Typography>
            </Box>

            <Box layoutClassName="max-h-[42vh] space-y-1.5 overflow-y-auto">
              {trackPreview.matched.map((m, i) => (
                <Box
                  key={`m-${i}`}
                  layoutClassName="flex items-center justify-between gap-3 rounded-lg px-3 py-2"
                  borderClassName="border border-emerald-100 dark:border-emerald-900/40"
                  backgroundClassName="bg-emerald-50/60 dark:bg-emerald-900/15"
                >
                  <Box layoutClassName="min-w-0 flex-1">
                    <Typography as="p" size="sm" layoutClassName="truncate font-semibold" textClassName="text-slate-700 dark:text-slate-200">
                      {m.orderNumber} · {m.orderCustomer}
                      {m.replaced ? (
                        <Typography as="span" size="xs" layoutClassName="ml-1.5 rounded px-1.5 py-0.5 font-semibold" backgroundClassName="bg-orange-100 dark:bg-orange-900/40" textClassName="text-orange-700 dark:text-orange-300">thay mã cũ đã huỷ</Typography>
                      ) : null}
                    </Typography>
                    <Typography as="span" size="xs" variant="muted">
                      {m.tracking}{m.status ? ` · ${m.status}` : ''}
                    </Typography>
                  </Box>
                  <Truck className="h-4 w-4 shrink-0 text-emerald-500" />
                </Box>
              ))}
              {(trackPreview.cancelled ?? []).map((c, i) => (
                <Box
                  key={`c-${i}`}
                  layoutClassName="flex items-center justify-between gap-3 rounded-lg px-3 py-2"
                  borderClassName="border border-orange-100 dark:border-orange-900/40"
                  backgroundClassName="bg-orange-50/60 dark:bg-orange-900/15"
                >
                  <Box layoutClassName="min-w-0 flex-1">
                    <Typography as="p" size="sm" layoutClassName="truncate" textClassName="text-orange-700 dark:text-orange-300">
                      {c.orderNumber} · {c.orderCustomer}
                    </Typography>
                    <Typography as="span" size="xs" variant="muted">
                      mã {c.cancelledTracking} đã huỷ · chờ tạo lại
                    </Typography>
                  </Box>
                  <XCircle className="h-4 w-4 shrink-0 text-orange-400" />
                </Box>
              ))}
              {trackPreview.skipped.map((s, i) => (
                <Box
                  key={`s-${i}`}
                  layoutClassName="flex items-center justify-between gap-3 rounded-lg px-3 py-2"
                  borderClassName="border border-amber-100 dark:border-amber-900/40"
                  backgroundClassName="bg-amber-50/60 dark:bg-amber-900/15"
                >
                  <Box layoutClassName="min-w-0 flex-1">
                    <Typography as="p" size="sm" layoutClassName="truncate" textClassName="text-amber-700 dark:text-amber-300">
                      {s.orderNumber} · {s.orderCustomer}
                    </Typography>
                    <Typography as="span" size="xs" variant="muted">
                      đã có {s.existingTracking} · giữ nguyên (bỏ qua {s.tracking})
                    </Typography>
                  </Box>
                  <Copy className="h-4 w-4 shrink-0 text-amber-400" />
                </Box>
              ))}
              {trackPreview.unmatched.map((u, i) => (
                <Box
                  key={`u-${i}`}
                  layoutClassName="flex items-center justify-between gap-3 rounded-lg px-3 py-2"
                  borderClassName="border border-slate-200 dark:border-slate-700"
                  backgroundClassName="bg-white dark:bg-slate-800"
                >
                  <Box layoutClassName="min-w-0 flex-1">
                    <Typography as="p" size="sm" layoutClassName="truncate" textClassName="text-slate-500 dark:text-slate-400">
                      {u.receiverName || '(không tên)'} · {u.phone || '—'}
                    </Typography>
                    <Typography as="span" size="xs" variant="muted">{u.tracking} · không tìm thấy đơn khớp</Typography>
                  </Box>
                  <XCircle className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
                </Box>
              ))}
            </Box>

            <Box layoutClassName="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                onClick={handleClose}
                variant="secondary"
                sizeClassName="px-4 py-2 text-sm"
                roundedClassName="rounded-lg"
                borderClassName="border border-slate-200 dark:border-slate-600"
                backgroundClassName="bg-white dark:bg-slate-800"
              >
                Huỷ
              </Button>
              <Button
                type="button"
                onClick={() => void handleApplyTracking()}
                disabled={busy || trackPreview.matchedCount === 0}
                variant="primary"
                backgroundClassName="bg-primary-600"
                hoverClassName="hover:bg-primary-700"
                textClassName="font-medium text-white"
                sizeClassName="px-4 py-2 text-sm"
                roundedClassName="rounded-lg"
                disableVariantHover
              >
                {busy ? 'Đang áp…' : `Áp dụng ${trackPreview.matchedCount} vận đơn`}
              </Button>
            </Box>
          </Box>
        ) : null}

        {/* ── Preview: THU HỘ COD ── */}
        {mode === 'cod' && codPreview ? (
          <Box layoutClassName="space-y-3">
            <Box layoutClassName="flex flex-wrap gap-4">
              <Typography as="span" size="sm" layoutClassName="inline-flex items-center gap-1.5 font-semibold" textClassName="text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Khớp {codPreview.matchedCount} đơn
              </Typography>
              <Typography as="span" size="sm" layoutClassName="inline-flex items-center gap-1.5 font-semibold" textClassName="text-amber-600 dark:text-amber-400">
                <Copy className="h-4 w-4" /> Đã import {codPreview.duplicateCount}
              </Typography>
              <Typography as="span" size="sm" layoutClassName="inline-flex items-center gap-1.5 font-semibold" textClassName="text-rose-500 dark:text-rose-400">
                <XCircle className="h-4 w-4" /> Không khớp {codPreview.unmatchedCount}
              </Typography>
            </Box>

            <Box layoutClassName="max-h-[42vh] space-y-1.5 overflow-y-auto">
              {codPreview.matched.map((m, i) => (
                <Box
                  key={`cm-${i}`}
                  layoutClassName="flex items-center justify-between gap-3 rounded-lg px-3 py-2"
                  borderClassName="border border-emerald-100 dark:border-emerald-900/40"
                  backgroundClassName="bg-emerald-50/60 dark:bg-emerald-900/15"
                >
                  <Box layoutClassName="min-w-0 flex-1">
                    <Typography as="p" size="sm" layoutClassName="truncate font-semibold" textClassName="text-slate-700 dark:text-slate-200">
                      {m.orderNumber} · {m.orderCustomer}
                    </Typography>
                    <Typography as="span" size="xs" variant="muted">
                      {m.tracking} · thu hộ {formatVND(m.amount)} → {PAY_STATUS_VI[m.statusAfter] ?? m.statusAfter}
                      {m.remainingAfter > 0 ? ` (còn ${formatVND(m.remainingAfter)})` : ''}
                    </Typography>
                  </Box>
                  <Wallet className="h-4 w-4 shrink-0 text-emerald-500" />
                </Box>
              ))}
              {codPreview.duplicate.map((d, i) => (
                <Box
                  key={`cd-${i}`}
                  layoutClassName="flex items-center justify-between gap-3 rounded-lg px-3 py-2"
                  borderClassName="border border-amber-100 dark:border-amber-900/40"
                  backgroundClassName="bg-amber-50/60 dark:bg-amber-900/15"
                >
                  <Box layoutClassName="min-w-0 flex-1">
                    <Typography as="p" size="sm" layoutClassName="truncate" textClassName="text-amber-700 dark:text-amber-300">
                      {d.orderNumber || d.tracking} · {formatVND(d.amount)}
                    </Typography>
                    <Typography as="span" size="xs" variant="muted">{d.tracking} · đã import trước đó (bỏ qua)</Typography>
                  </Box>
                  <Copy className="h-4 w-4 shrink-0 text-amber-400" />
                </Box>
              ))}
              {codPreview.unmatched.map((u, i) => (
                <Box
                  key={`cu-${i}`}
                  layoutClassName="flex items-center justify-between gap-3 rounded-lg px-3 py-2"
                  borderClassName="border border-slate-200 dark:border-slate-700"
                  backgroundClassName="bg-white dark:bg-slate-800"
                >
                  <Box layoutClassName="min-w-0 flex-1">
                    <Typography as="p" size="sm" layoutClassName="truncate" textClassName="text-slate-500 dark:text-slate-400">
                      {u.tracking} · {formatVND(u.amount)}
                    </Typography>
                    <Typography as="span" size="xs" variant="muted">không thấy đơn khớp (chưa đồng bộ vận đơn?)</Typography>
                  </Box>
                  <XCircle className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
                </Box>
              ))}
            </Box>

            <Box layoutClassName="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                onClick={handleClose}
                variant="secondary"
                sizeClassName="px-4 py-2 text-sm"
                roundedClassName="rounded-lg"
                borderClassName="border border-slate-200 dark:border-slate-600"
                backgroundClassName="bg-white dark:bg-slate-800"
              >
                Huỷ
              </Button>
              <Button
                type="button"
                onClick={() => void handleApplyCod()}
                disabled={busy || codPreview.matchedCount === 0}
                variant="primary"
                backgroundClassName="bg-primary-600"
                hoverClassName="hover:bg-primary-700"
                textClassName="font-medium text-white"
                sizeClassName="px-4 py-2 text-sm"
                roundedClassName="rounded-lg"
                disableVariantHover
              >
                {busy ? 'Đang áp…' : `Ghi nhận thu hộ ${codPreview.matchedCount} đơn`}
              </Button>
            </Box>
          </Box>
        ) : null}
      </Box>
    </BaseModal>
  );
};

export default TrackingImportModal;

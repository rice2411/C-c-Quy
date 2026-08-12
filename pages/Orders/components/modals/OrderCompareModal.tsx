/**
 * OrderCompareModal — ĐỐI CHIẾU (chỉ đọc) đơn đang lọc với file SPX.
 *
 * Không ghi DB: người dùng tải file vận đơn SPX, hệ thống ghép theo MÃ VẬN ĐƠN rồi
 * so từng đơn đang hiển thị với dòng tương ứng trong file để phát hiện lệch:
 *   • Số tiền thu hộ (COD) ≠ số CÒN PHẢI THU của đơn (remaining)  ← quan trọng nhất
 *   • Tên / SĐT người nhận khác nhau
 *   • Trạng thái vận đơn khác nhau
 *   • Đơn đang lọc nhưng THIẾU trong file (và dòng file không khớp đơn nào đang lọc)
 */
import React, { useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Upload, UserX, Wallet, XCircle } from 'lucide-react';
import { Order } from '@/types';
import { formatVND } from '@/utils/format/currencyUtil';
import BaseModal from '@/components/BaseModal';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Danh sách đơn ĐANG LỌC ở màn hình (mặc định lấy để đối chiếu). */
  orders: Order[];
}

/** Dòng đọc từ file SPX (chỉ các cột cần cho đối chiếu). */
interface FileRow {
  tracking: string;
  cod?: number;
  status?: string;
  name?: string;
  phone?: string;
}

/** Tìm cột theo tên header — không phân biệt hoa thường/khoảng trắng. */
const findCol = (header: any[], ...names: string[]): number => {
  const norm = (s: any) => String(s ?? '').trim().toLowerCase();
  const wanted = names.map(norm);
  return header.findIndex((c) => wanted.includes(norm(c)));
};

/** "+255.000" / "255,000" → number (bỏ dấu +, phân cách nghìn). */
const parseAmount = (v: any): number => {
  const n = Number(String(v ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? Math.round(n) : 0;
};

const normTracking = (s: any) => String(s ?? '').trim().toUpperCase();
const normName = (s: any) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
/** Giữ chữ số, lấy 9 số cuối (bỏ khác biệt số 0 đầu / +84). */
const normPhone = (s: any) => String(s ?? '').replace(/\D/g, '').slice(-9);

/** Số CÒN PHẢI THU của đơn = remaining (fallback total − đã trả), clamp ≥ 0. */
const expectedCod = (o: Order): number => {
  const r = typeof o.remaining === 'number' ? o.remaining : (Number(o.total) || 0) - (Number(o.paidAmount) || 0);
  return Math.max(0, Math.round(r));
};

const OrderCompareModal: React.FC<Props> = ({ isOpen, onClose, orders }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<FileRow[] | null>(null);
  const [hasCodCol, setHasCodCol] = useState(true);
  const [busy, setBusy] = useState(false);

  const reset = () => { setFileName(''); setRows(null); setHasCodCol(true); };
  const handleClose = () => { reset(); onClose(); };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    reset();
    setFileName(file.name);
    setBusy(true);
    try {
      const XLSX = await import('xlsx-js-style');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const grid = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, blankrows: false });

      // Header = dòng có cột mã vận đơn (file EN "Tracking No." hoặc VI "Mã vận đơn").
      const hIdx = grid.findIndex((r) => findCol(r, 'Tracking No.', 'Mã vận đơn') >= 0);
      if (hIdx < 0) {
        throw new Error('Không thấy cột mã vận đơn ("Tracking No." / "Mã vận đơn") trong file.');
      }
      const header = grid[hIdx];
      const cTrack = findCol(header, 'Tracking No.', 'Mã vận đơn');
      const cCod = findCol(
        header,
        'COD', 'COD Amount', 'COD to Collect', 'COD (VND)', 'Collect Amount',
        'Số tiền thu hộ', 'Tiền thu hộ', 'Đơn thu hộ', 'Số tiền COD',
      );
      const cStatus = findCol(header, 'Tracking Status', 'Trạng thái', 'Trạng thái vận đơn');
      const cName = findCol(header, 'Receiver Name', 'Tên người nhận', 'Người nhận');
      const cPhone = findCol(header, 'Receiver Phone Number', 'SĐT người nhận', 'Số điện thoại người nhận');

      const parsed: FileRow[] = [];
      for (let i = hIdx + 1; i < grid.length; i++) {
        const r = grid[i];
        const tracking = normTracking(r[cTrack]);
        if (!tracking || tracking.includes('MÃ VẬN ĐƠN')) continue;
        parsed.push({
          tracking,
          cod: cCod >= 0 ? parseAmount(r[cCod]) : undefined,
          status: cStatus >= 0 ? String(r[cStatus] ?? '').trim() : undefined,
          name: cName >= 0 ? String(r[cName] ?? '').trim() : undefined,
          phone: cPhone >= 0 ? String(r[cPhone] ?? '').trim() : undefined,
        });
      }
      if (parsed.length === 0) throw new Error('Không đọc được dòng vận đơn nào trong file.');
      setHasCodCol(cCod >= 0);
      setRows(parsed);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Đọc file thất bại');
      reset();
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const report = useMemo(() => {
    if (!rows) return null;
    const fileMap = new Map<string, FileRow>();
    for (const r of rows) if (r.tracking) fileMap.set(r.tracking, r);
    const matchedTrackings = new Set<string>();

    const codMismatch: { order: Order; fileCod: number; expected: number; diff: number }[] = [];
    const infoMismatch: { order: Order; nameFile?: string; phoneFile?: string; nameDiff: boolean; phoneDiff: boolean }[] = [];
    const statusDiff: { order: Order; fileStatus?: string }[] = [];
    const missingInFile: Order[] = [];
    const noTracking: Order[] = [];
    let fullyMatched = 0;

    for (const o of orders) {
      const tn = normTracking(o.trackingNumber);
      if (!tn) { noTracking.push(o); continue; }
      const row = fileMap.get(tn);
      if (!row) { missingInFile.push(o); continue; }
      matchedTrackings.add(tn);

      let ok = true;
      if (hasCodCol && typeof row.cod === 'number') {
        const exp = expectedCod(o);
        const diff = row.cod - exp;
        if (diff !== 0) { codMismatch.push({ order: o, fileCod: row.cod, expected: exp, diff }); ok = false; }
      }
      const nameDiff = !!row.name && !!o.customer?.name && normName(row.name) !== normName(o.customer.name);
      const phoneDiff = !!row.phone && !!o.customer?.phone && normPhone(row.phone) !== normPhone(o.customer.phone);
      if (nameDiff || phoneDiff) {
        infoMismatch.push({ order: o, nameFile: row.name, phoneFile: row.phone, nameDiff, phoneDiff });
        ok = false;
      }
      if (row.status && normName(row.status) !== normName(o.trackingStatus)) {
        statusDiff.push({ order: o, fileStatus: row.status });
        ok = false;
      }
      if (ok) fullyMatched += 1;
    }

    const extraInFile = rows.filter((r) => !matchedTrackings.has(r.tracking));

    return { codMismatch, infoMismatch, statusDiff, missingInFile, noTracking, extraInFile, fullyMatched };
  }, [rows, orders, hasCodCol]);

  const hasAnyIssue = !!report && (
    report.codMismatch.length + report.infoMismatch.length + report.statusDiff.length +
    report.missingInFile.length + report.extraInFile.length > 0
  );

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="So sánh vận đơn với file SPX" size="lg">
      <Box layoutClassName="space-y-4">
        <Typography as="p" size="sm" variant="muted">
          Đối chiếu <b>{orders.length}</b> đơn đang lọc với file vận đơn SPX (ghép theo <b>mã vận đơn</b>).
          Chỉ để xem — <b>không</b> thay đổi dữ liệu. Tập trung kiểm tra <b>số tiền thu hộ</b> so với số
          còn phải thu của đơn.
        </Typography>

        {/* File picker */}
        <Box layoutClassName="flex items-center gap-3">
          <Input ref={inputRef} type="file" accept=".xlsx,.xls" containerClassName="hidden" onChange={handleFile} />
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
            </Typography>
          ) : null}
        </Box>

        {busy ? <Typography as="p" size="sm" variant="muted">Đang đọc file + đối chiếu…</Typography> : null}

        {!hasCodCol && rows ? (
          <Typography as="p" size="xs" layoutClassName="inline-flex items-center gap-1.5" textClassName="text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" /> File không có cột số tiền thu hộ — bỏ qua đối chiếu COD, chỉ so tên/SĐT/trạng thái.
          </Typography>
        ) : null}

        {report ? (
          <Box layoutClassName="space-y-3">
            {/* Summary */}
            <Box layoutClassName="flex flex-wrap gap-x-4 gap-y-2">
              <Typography as="span" size="sm" layoutClassName="inline-flex items-center gap-1.5 font-semibold" textClassName="text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Khớp {report.fullyMatched}
              </Typography>
              <Typography as="span" size="sm" layoutClassName="inline-flex items-center gap-1.5 font-semibold" textClassName="text-rose-600 dark:text-rose-400">
                <Wallet className="h-4 w-4" /> Lệch tiền thu hộ {report.codMismatch.length}
              </Typography>
              <Typography as="span" size="sm" layoutClassName="inline-flex items-center gap-1.5 font-semibold" textClassName="text-amber-600 dark:text-amber-400">
                <UserX className="h-4 w-4" /> Lệch tên/SĐT {report.infoMismatch.length}
              </Typography>
              <Typography as="span" size="sm" layoutClassName="inline-flex items-center gap-1.5 font-semibold" textClassName="text-sky-600 dark:text-sky-400">
                <AlertTriangle className="h-4 w-4" /> Lệch trạng thái {report.statusDiff.length}
              </Typography>
              <Typography as="span" size="sm" layoutClassName="inline-flex items-center gap-1.5 font-semibold" textClassName="text-slate-500 dark:text-slate-400">
                <XCircle className="h-4 w-4" /> Thiếu trong file {report.missingInFile.length} · Thừa {report.extraInFile.length}
              </Typography>
            </Box>

            <Box layoutClassName="max-h-[46vh] space-y-3 overflow-y-auto pr-1">
              {/* 1. Lệch số tiền thu hộ */}
              {report.codMismatch.length > 0 ? (
                <Box layoutClassName="space-y-1.5">
                  <Typography as="p" size="xs" layoutClassName="font-semibold uppercase tracking-wide" textClassName="text-rose-600 dark:text-rose-400">
                    Lệch số tiền thu hộ
                  </Typography>
                  {report.codMismatch.map((m, i) => (
                    <Box
                      key={`cod-${i}`}
                      layoutClassName="flex items-center justify-between gap-3 rounded-lg px-3 py-2"
                      borderClassName="border border-rose-100 dark:border-rose-900/40"
                      backgroundClassName="bg-rose-50/60 dark:bg-rose-900/15"
                    >
                      <Box layoutClassName="min-w-0 flex-1">
                        <Typography as="p" size="sm" layoutClassName="truncate font-semibold" textClassName="text-slate-700 dark:text-slate-200">
                          {m.order.orderNumber} · {m.order.customer?.name || '(không tên)'}
                        </Typography>
                        <Typography as="span" size="xs" variant="muted">
                          {m.order.trackingNumber} · File thu hộ {formatVND(m.fileCod)} · Cần thu {formatVND(m.expected)}
                        </Typography>
                      </Box>
                      <Typography as="span" size="sm" layoutClassName="shrink-0 font-bold" textClassName={m.diff > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}>
                        {m.diff > 0 ? '+' : ''}{formatVND(m.diff)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : null}

              {/* 2. Lệch tên / SĐT */}
              {report.infoMismatch.length > 0 ? (
                <Box layoutClassName="space-y-1.5">
                  <Typography as="p" size="xs" layoutClassName="font-semibold uppercase tracking-wide" textClassName="text-amber-600 dark:text-amber-400">
                    Lệch tên / SĐT người nhận
                  </Typography>
                  {report.infoMismatch.map((m, i) => (
                    <Box
                      key={`info-${i}`}
                      layoutClassName="rounded-lg px-3 py-2"
                      borderClassName="border border-amber-100 dark:border-amber-900/40"
                      backgroundClassName="bg-amber-50/60 dark:bg-amber-900/15"
                    >
                      <Typography as="p" size="sm" layoutClassName="truncate font-semibold" textClassName="text-slate-700 dark:text-slate-200">
                        {m.order.orderNumber} · {m.order.trackingNumber}
                      </Typography>
                      {m.nameDiff ? (
                        <Typography as="span" size="xs" variant="muted" layoutClassName="block">
                          Tên — đơn: {m.order.customer?.name || '—'} · file: {m.nameFile || '—'}
                        </Typography>
                      ) : null}
                      {m.phoneDiff ? (
                        <Typography as="span" size="xs" variant="muted" layoutClassName="block">
                          SĐT — đơn: {m.order.customer?.phone || '—'} · file: {m.phoneFile || '—'}
                        </Typography>
                      ) : null}
                    </Box>
                  ))}
                </Box>
              ) : null}

              {/* 3. Lệch trạng thái */}
              {report.statusDiff.length > 0 ? (
                <Box layoutClassName="space-y-1.5">
                  <Typography as="p" size="xs" layoutClassName="font-semibold uppercase tracking-wide" textClassName="text-sky-600 dark:text-sky-400">
                    Lệch trạng thái vận đơn
                  </Typography>
                  {report.statusDiff.map((m, i) => (
                    <Box
                      key={`st-${i}`}
                      layoutClassName="flex items-center justify-between gap-3 rounded-lg px-3 py-2"
                      borderClassName="border border-sky-100 dark:border-sky-900/40"
                      backgroundClassName="bg-sky-50/60 dark:bg-sky-900/15"
                    >
                      <Box layoutClassName="min-w-0 flex-1">
                        <Typography as="p" size="sm" layoutClassName="truncate font-semibold" textClassName="text-slate-700 dark:text-slate-200">
                          {m.order.orderNumber} · {m.order.trackingNumber}
                        </Typography>
                        <Typography as="span" size="xs" variant="muted">
                          đơn: {m.order.trackingStatus || '—'} · file: {m.fileStatus || '—'}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : null}

              {/* 4. Đơn thiếu trong file */}
              {report.missingInFile.length > 0 ? (
                <Box layoutClassName="space-y-1.5">
                  <Typography as="p" size="xs" layoutClassName="font-semibold uppercase tracking-wide" textClassName="text-slate-500 dark:text-slate-400">
                    Đơn đang lọc nhưng KHÔNG có trong file
                  </Typography>
                  {report.missingInFile.map((o, i) => (
                    <Box
                      key={`miss-${i}`}
                      layoutClassName="flex items-center justify-between gap-3 rounded-lg px-3 py-2"
                      borderClassName="border border-slate-200 dark:border-slate-700"
                      backgroundClassName="bg-white dark:bg-slate-800"
                    >
                      <Box layoutClassName="min-w-0 flex-1">
                        <Typography as="p" size="sm" layoutClassName="truncate" textClassName="text-slate-600 dark:text-slate-300">
                          {o.orderNumber} · {o.customer?.name || '(không tên)'}
                        </Typography>
                        <Typography as="span" size="xs" variant="muted">{o.trackingNumber}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : null}

              {/* 5. Dòng file không khớp đơn đang lọc */}
              {report.extraInFile.length > 0 ? (
                <Box layoutClassName="space-y-1.5">
                  <Typography as="p" size="xs" layoutClassName="font-semibold uppercase tracking-wide" textClassName="text-slate-500 dark:text-slate-400">
                    Dòng file không khớp đơn nào đang lọc
                  </Typography>
                  {report.extraInFile.map((r, i) => (
                    <Box
                      key={`extra-${i}`}
                      layoutClassName="flex items-center justify-between gap-3 rounded-lg px-3 py-2"
                      borderClassName="border border-slate-200 dark:border-slate-700"
                      backgroundClassName="bg-white dark:bg-slate-800"
                    >
                      <Box layoutClassName="min-w-0 flex-1">
                        <Typography as="p" size="sm" layoutClassName="truncate" textClassName="text-slate-600 dark:text-slate-300">
                          {r.tracking}{r.name ? ` · ${r.name}` : ''}
                        </Typography>
                        <Typography as="span" size="xs" variant="muted">
                          {typeof r.cod === 'number' ? `thu hộ ${formatVND(r.cod)}` : ''}{r.status ? ` · ${r.status}` : ''}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : null}

              {report.noTracking.length > 0 ? (
                <Typography as="p" size="xs" variant="muted">
                  {report.noTracking.length} đơn đang lọc chưa có mã vận đơn — không đối chiếu được.
                </Typography>
              ) : null}

              {!hasAnyIssue ? (
                <Typography as="p" size="sm" layoutClassName="inline-flex items-center gap-1.5 py-2 font-semibold" textClassName="text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> Không phát hiện lệch — mọi đơn khớp với file.
                </Typography>
              ) : null}
            </Box>
          </Box>
        ) : null}

        <Box layoutClassName="flex justify-end pt-1">
          <Button
            type="button"
            onClick={handleClose}
            variant="secondary"
            sizeClassName="px-4 py-2 text-sm"
            roundedClassName="rounded-lg"
            borderClassName="border border-slate-200 dark:border-slate-600"
            backgroundClassName="bg-white dark:bg-slate-800"
          >
            Đóng
          </Button>
        </Box>
      </Box>
    </BaseModal>
  );
};

export default OrderCompareModal;

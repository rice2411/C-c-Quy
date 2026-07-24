import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx-js-style';
import { CheckCircle2, FileSpreadsheet, Truck, Upload, XCircle } from 'lucide-react';
import { syncOrderTracking, TrackingRow, TrackingSyncResult } from '@/services/orderService';
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

/** Tìm cột theo tên header (EN) — không phân biệt hoa thường/khoảng trắng. */
const findCol = (header: any[], ...names: string[]): number => {
  const norm = (s: any) => String(s ?? '').trim().toLowerCase();
  const wanted = names.map(norm);
  return header.findIndex((c) => wanted.includes(norm(c)));
};

const TrackingImportModal: React.FC<Props> = ({ isOpen, onClose, onApplied }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<TrackingRow[]>([]);
  const [preview, setPreview] = useState<TrackingSyncResult | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => { setFileName(''); setRows([]); setPreview(null); };

  const handleClose = () => { reset(); onClose(); };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const grid = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, blankrows: false });
      // Tìm dòng header EN (chứa "Tracking No.")
      const hIdx = grid.findIndex((r) => findCol(r, 'Tracking No.') >= 0);
      if (hIdx < 0) throw new Error('Không thấy cột "Tracking No." — file không đúng định dạng SPX.');
      const header = grid[hIdx];
      const cTrack = findCol(header, 'Tracking No.');
      const cLink = findCol(header, 'Tracking No. link');
      const cStatus = findCol(header, 'Tracking Status');
      const cName = findCol(header, 'Receiver Name');
      const cPhone = findCol(header, 'Receiver Phone Number');
      const parsed: TrackingRow[] = [];
      for (let i = hIdx + 1; i < grid.length; i++) {
        const r = grid[i];
        const tracking = String(r[cTrack] ?? '').trim();
        // bỏ dòng header VN ("Mã vận đơn") + dòng rỗng
        if (!tracking || tracking.toLowerCase().includes('mã vận đơn')) continue;
        parsed.push({
          tracking,
          link: cLink >= 0 ? String(r[cLink] ?? '').trim() : undefined,
          status: cStatus >= 0 ? String(r[cStatus] ?? '').trim() : undefined,
          name: cName >= 0 ? String(r[cName] ?? '').trim() : undefined,
          phone: cPhone >= 0 ? String(r[cPhone] ?? '').trim() : undefined,
        });
      }
      if (parsed.length === 0) throw new Error('Không đọc được dòng vận đơn nào.');
      setRows(parsed);
      const res = await syncOrderTracking(parsed, false); // preview
      setPreview(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Đọc file thất bại');
      reset();
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleApply = async () => {
    if (!rows.length) return;
    setBusy(true);
    try {
      const res = await syncOrderTracking(rows, true);
      toast.success(`Đã đồng bộ ${res.matchedCount} vận đơn vào đơn hàng`);
      onApplied();
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Đồng bộ thất bại');
    } finally {
      setBusy(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Đồng bộ vận đơn từ file (SPX/GHTK…)" size="lg">
      <Box layoutClassName="space-y-4">
        <Typography as="p" size="sm" variant="muted">
          Tải file Excel xuất từ đơn vị vận chuyển. Hệ thống khớp theo <b>SĐT + tên người nhận</b>,
          gán mã vận đơn + link tra cứu + trạng thái vào đơn hàng tương ứng.
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
            </Typography>
          ) : null}
        </Box>

        {busy && !preview ? (
          <Typography as="p" size="sm" variant="muted">Đang đọc file + đối chiếu…</Typography>
        ) : null}

        {/* Preview */}
        {preview ? (
          <Box layoutClassName="space-y-3">
            <Box layoutClassName="flex flex-wrap gap-4">
              <Typography as="span" size="sm" layoutClassName="inline-flex items-center gap-1.5 font-semibold" textClassName="text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Khớp {preview.matchedCount} đơn
              </Typography>
              <Typography as="span" size="sm" layoutClassName="inline-flex items-center gap-1.5 font-semibold" textClassName="text-rose-500 dark:text-rose-400">
                <XCircle className="h-4 w-4" /> Không khớp {preview.unmatchedCount}
              </Typography>
            </Box>

            <Box layoutClassName="max-h-[42vh] space-y-1.5 overflow-y-auto">
              {preview.matched.map((m, i) => (
                <Box
                  key={`m-${i}`}
                  layoutClassName="flex items-center justify-between gap-3 rounded-lg px-3 py-2"
                  borderClassName="border border-emerald-100 dark:border-emerald-900/40"
                  backgroundClassName="bg-emerald-50/60 dark:bg-emerald-900/15"
                >
                  <Box layoutClassName="min-w-0 flex-1">
                    <Typography as="p" size="sm" layoutClassName="truncate font-semibold" textClassName="text-slate-700 dark:text-slate-200">
                      {m.orderNumber} · {m.orderCustomer}
                      {m.hadTracking ? ' (ghi đè)' : ''}
                    </Typography>
                    <Typography as="span" size="xs" variant="muted">
                      {m.tracking}{m.status ? ` · ${m.status}` : ''}
                    </Typography>
                  </Box>
                  <Truck className="h-4 w-4 shrink-0 text-emerald-500" />
                </Box>
              ))}
              {preview.unmatched.map((u, i) => (
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
                onClick={() => void handleApply()}
                disabled={busy || preview.matchedCount === 0}
                variant="primary"
                backgroundClassName="bg-primary-600"
                hoverClassName="hover:bg-primary-700"
                textClassName="font-medium text-white"
                sizeClassName="px-4 py-2 text-sm"
                roundedClassName="rounded-lg"
                disableVariantHover
              >
                {busy ? 'Đang áp…' : `Áp dụng ${preview.matchedCount} vận đơn`}
              </Button>
            </Box>
          </Box>
        ) : null}
      </Box>
    </BaseModal>
  );
};

export default TrackingImportModal;

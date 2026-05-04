import React, { useCallback, useEffect, useState } from 'react';
import {
  collection,
  deleteField,
  doc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import toast from 'react-hot-toast';
import {
  Copy,
  Download,
  Package,
  RefreshCw,
  Search,
  Trash2,
  Wand2,
} from 'lucide-react';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Checkbox from '@/components/ui/Checkbox';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import Textarea from '@/components/ui/Textarea';
import Typography from '@/components/ui/Typography';

const PRODUCTS_COLLECTION = 'products';
const FIRESTORE_BATCH_MAX = 500;

type FirestoreDocData = Record<string, unknown>;

const pathExists = (data: FirestoreDocData, path: string): boolean => {
  const parts = path.split('.');
  let cur: unknown = data;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object' || !Object.prototype.hasOwnProperty.call(cur, p)) {
      return false;
    }
    cur = (cur as FirestoreDocData)[p];
  }
  return true;
};

const getAtPath = (data: FirestoreDocData, path: string): unknown => {
  const parts = path.split('.');
  let cur: unknown = data;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object' || !Object.prototype.hasOwnProperty.call(cur, p)) {
      return undefined;
    }
    cur = (cur as FirestoreDocData)[p];
  }
  return cur;
};

const parseBulkValue = (raw: string): unknown => {
  const t = raw.trim();
  if (!t) return '';
  try {
    return JSON.parse(t) as unknown;
  } catch {
    return raw;
  }
};

const stripUndefinedDeep = (value: unknown): unknown => {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map(stripUndefinedDeep).filter((v) => v !== undefined);
  }
  const out: FirestoreDocData = {};
  for (const [k, v] of Object.entries(value)) {
    const next = stripUndefinedDeep(v);
    if (next !== undefined) out[k] = next;
  }
  return out;
};

const toComparable = (value: unknown, normalizeString: boolean): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') {
    return normalizeString ? value.trim().toLowerCase() : value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

export interface ProductDatabaseToolsPanelProps {
  onMutate: () => void;
  /** Tăng khi collection `products` thay đổi bên ngoài panel (vd. xóa bảng) để refetch thống kê */
  refreshStatsNonce?: number;
}

const ProductDatabaseToolsPanel: React.FC<ProductDatabaseToolsPanelProps> = ({
  onMutate,
  refreshStatsNonce = 0,
}) => {
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState<{ total: number; active: number; inactive: number } | null>(null);

  const [setFieldPath, setSetFieldPath] = useState('');
  const [setFieldValueRaw, setSetFieldValueRaw] = useState('');
  const [setOnlyIfMissing, setSetOnlyIfMissing] = useState(false);
  const [setBusy, setSetBusy] = useState(false);

  const [delFieldPath, setDelFieldPath] = useState('');
  const [delBusy, setDelBusy] = useState(false);

  const [renameFrom, setRenameFrom] = useState('');
  const [renameTo, setRenameTo] = useState('');
  const [renameBusy, setRenameBusy] = useState(false);

  const [dupFieldPath, setDupFieldPath] = useState('name');
  const [dupNormalize, setDupNormalize] = useState(true);
  const [dupSkipEmpty, setDupSkipEmpty] = useState(true);
  const [dupResult, setDupResult] = useState<string>('');
  const [dupBusy, setDupBusy] = useState(false);

  const [missFieldPath, setMissFieldPath] = useState('name');
  const [missResult, setMissResult] = useState<string>('');
  const [missBusy, setMissBusy] = useState(false);

  const [auditResult, setAuditResult] = useState<string>('');
  const [auditBusy, setAuditBusy] = useState(false);

  const [exportBusy, setExportBusy] = useState(false);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const snap = await getDocs(collection(db, PRODUCTS_COLLECTION));
      let active = 0;
      let inactive = 0;
      snap.docs.forEach((d) => {
        const s = d.data().status;
        if (s === 'inactive') inactive += 1;
        else active += 1;
      });
      setStats({ total: snap.size, active, inactive });
    } catch (e) {
      console.error(e);
      toast.error('Không tải được thống kê products');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats, refreshStatsNonce]);

  const runBulkSet = async () => {
    const path = setFieldPath.trim();
    if (!path) {
      toast.error('Nhập tên field');
      return;
    }
    const parsed = stripUndefinedDeep(parseBulkValue(setFieldValueRaw));
    if (parsed === undefined) {
      toast.error('Giá trị không hợp lệ');
      return;
    }
    const snap = await getDocs(collection(db, PRODUCTS_COLLECTION));
    if (snap.empty) {
      toast.error('Không có product');
      return;
    }
    let targets = snap.docs;
    if (setOnlyIfMissing) {
      targets = snap.docs.filter((d) => !pathExists(d.data() as FirestoreDocData, path));
    }
    if (targets.length === 0) {
      toast.error('Không có document nào khớp điều kiện');
      return;
    }
    const ok = window.confirm(
      `Gán field "${path}" cho ${targets.length} product?${setOnlyIfMissing ? ' (chỉ bản ghi chưa có field)' : ''}`
    );
    if (!ok) return;

    setSetBusy(true);
    try {
      const ids = targets.map((d) => d.id);
      for (let i = 0; i < ids.length; i += FIRESTORE_BATCH_MAX) {
        const chunk = ids.slice(i, i + FIRESTORE_BATCH_MAX);
        const batch = writeBatch(db);
        chunk.forEach((id) => {
          batch.update(doc(db, PRODUCTS_COLLECTION, id), { [path]: parsed } as Record<string, unknown>);
        });
        await batch.commit();
      }
      toast.success(`Đã cập nhật ${targets.length} product`);
      setSetFieldValueRaw('');
      onMutate();
      void loadStats();
    } catch (e) {
      console.error(e);
      toast.error('Không thể gán field (kiểm tra kiểu dữ liệu / quyền Firestore)');
    } finally {
      setSetBusy(false);
    }
  };

  const runBulkDelete = async () => {
    const path = delFieldPath.trim();
    if (!path) {
      toast.error('Nhập tên field');
      return;
    }
    const snap = await getDocs(collection(db, PRODUCTS_COLLECTION));
    if (snap.empty) {
      toast.error('Không có product');
      return;
    }
    const ids = snap.docs.map((d) => d.id);
    if (!window.confirm(`Xóa field "${path}" trên ${ids.length} product? Field lồng nhau dùng dấu chấm (vd: meta.old).`)) return;

    setDelBusy(true);
    try {
      for (let i = 0; i < ids.length; i += FIRESTORE_BATCH_MAX) {
        const chunk = ids.slice(i, i + FIRESTORE_BATCH_MAX);
        const batch = writeBatch(db);
        chunk.forEach((id) => {
          batch.update(doc(db, PRODUCTS_COLLECTION, id), { [path]: deleteField() });
        });
        await batch.commit();
      }
      toast.success(`Đã cập nhật ${ids.length} product`);
      setDelFieldPath('');
      onMutate();
      void loadStats();
    } catch (e) {
      console.error(e);
      toast.error('Không thể xóa field');
    } finally {
      setDelBusy(false);
    }
  };

  const runRename = async () => {
    const from = renameFrom.trim();
    const to = renameTo.trim();
    if (!from || !to) {
      toast.error('Nhập field nguồn và field đích');
      return;
    }
    if (from === to) {
      toast.error('Hai field phải khác nhau');
      return;
    }
    const snap = await getDocs(collection(db, PRODUCTS_COLLECTION));
    const withOld = snap.docs.filter((d) => pathExists(d.data() as FirestoreDocData, from));
    if (withOld.length === 0) {
      toast.error('Không có product nào có field nguồn');
      return;
    }
    if (
      !window.confirm(
        `Đổi tên (copy) "${from}" → "${to}" trên ${withOld.length} product? Field nguồn sẽ bị xóa sau khi copy.`
      )
    ) {
      return;
    }

    setRenameBusy(true);
    try {
      for (let offset = 0; offset < withOld.length; offset += FIRESTORE_BATCH_MAX) {
        const chunk = withOld.slice(offset, offset + FIRESTORE_BATCH_MAX);
        const batch = writeBatch(db);
        chunk.forEach((snap) => {
          const data = snap.data() as FirestoreDocData;
          const val = getAtPath(data, from);
          batch.update(doc(db, PRODUCTS_COLLECTION, snap.id), {
            [to]: val as never,
            [from]: deleteField(),
          });
        });
        await batch.commit();
      }
      toast.success(`Đã đổi tên field trên ${withOld.length} product`);
      setRenameFrom('');
      setRenameTo('');
      onMutate();
      void loadStats();
    } catch (e) {
      console.error(e);
      toast.error('Không thể đổi tên field');
    } finally {
      setRenameBusy(false);
    }
  };

  const runDupCheck = async () => {
    const path = dupFieldPath.trim();
    if (!path) {
      toast.error('Nhập field cần so trùng');
      return;
    }
    setDupBusy(true);
    setDupResult('');
    try {
      const snap = await getDocs(collection(db, PRODUCTS_COLLECTION));
      const map = new Map<string, string[]>();
      snap.docs.forEach((d) => {
        const raw = getAtPath(d.data() as FirestoreDocData, path);
        const key = toComparable(raw, dupNormalize);
        if (dupSkipEmpty && key === '') return;
        const list = map.get(key) ?? [];
        list.push(d.id);
        map.set(key, list);
      });
      const lines: string[] = [];
      map.forEach((ids, key) => {
        if (ids.length > 1) {
          lines.push(`Giá trị: ${key || '(rỗng)'}\n  → ${ids.length} product: ${ids.join(', ')}`);
        }
      });
      setDupResult(
        lines.length
          ? lines.join('\n\n')
          : dupSkipEmpty
            ? 'Không phát hiện trùng (hoặc mọi giá trị đều rỗng và đã bỏ qua).'
            : 'Không phát hiện trùng.'
      );
      toast.success('Đã quét xong');
    } catch (e) {
      console.error(e);
      toast.error('Không thể quét trùng');
    } finally {
      setDupBusy(false);
    }
  };

  const runMissingCheck = async () => {
    const path = missFieldPath.trim();
    if (!path) {
      toast.error('Nhập field');
      return;
    }
    setMissBusy(true);
    setMissResult('');
    try {
      const snap = await getDocs(collection(db, PRODUCTS_COLLECTION));
      const missing = snap.docs
        .filter((d) => !pathExists(d.data() as FirestoreDocData, path))
        .map((d) => d.id);
      setMissResult(
        missing.length ? `${missing.length} product thiếu "${path}":\n${missing.join(', ')}` : `Mọi product đều có "${path}".`
      );
      toast.success('Đã kiểm tra');
    } catch (e) {
      console.error(e);
      toast.error('Không thể kiểm tra');
    } finally {
      setMissBusy(false);
    }
  };

  const runAuditNames = async () => {
    setAuditBusy(true);
    setAuditResult('');
    try {
      const snap = await getDocs(collection(db, PRODUCTS_COLLECTION));
      const bad: string[] = [];
      snap.docs.forEach((d) => {
        const name = d.data().name;
        const s = name == null ? '' : String(name).trim();
        if (!s) bad.push(d.id);
      });
      setAuditResult(
        bad.length
          ? `${bad.length} product có name rỗng / thiếu:\n${bad.join(', ')}`
          : 'Mọi product đều có name không rỗng.'
      );
      toast.success('Đã kiểm tra');
    } catch (e) {
      console.error(e);
      toast.error('Không thể kiểm tra');
    } finally {
      setAuditBusy(false);
    }
  };

  const runExport = async () => {
    setExportBusy(true);
    try {
      const snap = await getDocs(collection(db, PRODUCTS_COLLECTION));
      const rows = snap.docs.map((d) => {
        const data = d.data();
        const plain: Record<string, unknown> = { id: d.id };
        for (const [k, v] of Object.entries(data)) {
          if (v && typeof v === 'object' && 'toDate' in v && typeof (v as { toDate?: () => Date }).toDate === 'function') {
            try {
              plain[k] = (v as { toDate: () => Date }).toDate().toISOString();
            } catch {
              plain[k] = String(v);
            }
          } else {
            plain[k] = v as unknown;
          }
        }
        return plain;
      });
      const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Đã xuất ${rows.length} product`);
    } catch (e) {
      console.error(e);
      toast.error('Không thể xuất file');
    } finally {
      setExportBusy(false);
    }
  };

  const busyIcon = (busy: boolean) =>
    busy ? <Spinner size="sm" textClassName="text-white" borderClassName="border-white" /> : undefined;

  return (
    <Box layoutClassName="space-y-4">
      <Card
        padding="md"
        roundedClassName="rounded-lg"
        borderClassName="border-slate-200 dark:border-slate-700"
        backgroundClassName="bg-violet-50/70 dark:bg-violet-950/25"
      >
        <Box layoutClassName="flex flex-wrap items-center justify-between gap-3">
          <Box layoutClassName="flex items-center gap-2">
            <Package className="h-5 w-5 text-violet-600 dark:text-violet-300" />
            <Typography size="sm" layoutClassName="font-semibold text-violet-900 dark:text-violet-100">
              Công cụ collection products
            </Typography>
          </Box>
          <Button
            type="button"
            variant="secondary"
            sizeClassName="px-3 py-1.5 text-sm"
            onClick={() => void loadStats()}
            disabled={statsLoading}
            leftIcon={statsLoading ? busyIcon(true) : <RefreshCw className="h-4 w-4" />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
            layoutClassName="inline-flex items-center gap-2"
          >
            Làm mới thống kê
          </Button>
        </Box>
        <Typography size="xs" variant="muted" layoutClassName="mt-2 text-violet-900/80 dark:text-violet-200/80">
          Gán field, xóa field, đổi tên field, kiểm tra trùng / thiếu field, audit tên, xuất JSON — chỉ cho collection{' '}
          <span className="font-mono text-[11px]">products</span>.
        </Typography>
        {stats && (
          <Box layoutClassName="mt-3 flex flex-wrap gap-3">
            <BadgeStat label="Tổng" value={String(stats.total)} />
            <BadgeStat label="active" value={String(stats.active)} />
            <BadgeStat label="inactive" value={String(stats.inactive)} />
          </Box>
        )}
      </Card>

      <Card padding="md" roundedClassName="rounded-lg" borderClassName="border-slate-200 dark:border-slate-700">
        <Typography size="sm" layoutClassName="font-semibold">Gán / cập nhật field đồng loạt</Typography>
        <Typography size="xs" variant="muted" layoutClassName="mt-1">
          Giá trị nhập JSON hợp lệ (số, chuỗi trong dấu ngoặc kép, true/false, mảng, object). Nếu không parse được JSON thì lưu nguyên chuỗi.
        </Typography>
        <Box layoutClassName="mt-3 grid gap-3 md:grid-cols-2">
          <Box>
            <Typography size="xs" layoutClassName="mb-1 font-medium">Field</Typography>
            <Input
              value={setFieldPath}
              onChange={(e) => setSetFieldPath(e.target.value)}
              placeholder="vd: status hoặc meta.flag"
              disabled={setBusy}
              size="sm"
              containerClassName="w-full"
            />
          </Box>
          <Box layoutClassName="flex items-end">
            <Checkbox
              label="Chỉ bản ghi chưa có field này"
              checked={setOnlyIfMissing}
              onChange={(e) => setSetOnlyIfMissing(e.target.checked)}
              disabled={setBusy}
            />
          </Box>
        </Box>
        <Box layoutClassName="mt-2">
          <Typography size="xs" layoutClassName="mb-1 font-medium">Giá trị</Typography>
          <Textarea
            value={setFieldValueRaw}
            onChange={(e) => setSetFieldValueRaw(e.target.value)}
            placeholder='vd: "active" hoặc 0 hoặc ["a","b"]'
            disabled={setBusy}
            size="sm"
            resize="vertical"
            rows={3}
            containerClassName="w-full"
          />
        </Box>
        <Button
          type="button"
          variant="primary"
          className="mt-3"
          onClick={() => void runBulkSet()}
          disabled={setBusy}
          leftIcon={setBusy ? busyIcon(true) : <Wand2 className="h-4 w-4" />}
          iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
          sizeClassName="px-4 py-2"
          roundedClassName="rounded-lg"
          layoutClassName="inline-flex items-center gap-2"
        >
          {setBusy ? 'Đang ghi...' : 'Áp dụng cho mọi product (theo điều kiện)'}
        </Button>
      </Card>

      <Card padding="md" roundedClassName="rounded-lg" borderClassName="border-slate-200 dark:border-slate-700">
        <Typography size="sm" layoutClassName="font-semibold">Xóa field đồng loạt</Typography>
        <Typography size="xs" variant="muted" layoutClassName="mt-1">
          Xóa một field trên mọi product (path lồng nhau: dấu chấm, ví dụ <span className="font-mono text-[11px]">metadata.temp</span>).
        </Typography>
        <Box layoutClassName="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <Box layoutClassName="min-w-0 flex-1">
            <Typography size="xs" layoutClassName="mb-1 font-medium">Tên field</Typography>
            <Input
              value={delFieldPath}
              onChange={(e) => setDelFieldPath(e.target.value)}
              placeholder="vd: legacyCode hoặc extra.oldFlag"
              disabled={delBusy}
              size="sm"
              containerClassName="w-full"
            />
          </Box>
          <Button
            type="button"
            variant="danger"
            onClick={() => void runBulkDelete()}
            disabled={delBusy || !delFieldPath.trim()}
            leftIcon={delBusy ? busyIcon(true) : <Trash2 className="h-4 w-4" />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
            sizeClassName="px-4 py-2"
            roundedClassName="rounded-lg"
            layoutClassName="inline-flex shrink-0 items-center gap-2"
            stateClassName="disabled:cursor-not-allowed disabled:opacity-50"
          >
            {delBusy ? 'Đang xử lý...' : 'Xóa field trên mọi product'}
          </Button>
        </Box>
      </Card>

      <Card padding="md" roundedClassName="rounded-lg" borderClassName="border-slate-200 dark:border-slate-700">
        <Typography size="sm" layoutClassName="font-semibold">Đổi tên field (copy giá trị rồi xóa field cũ)</Typography>
        <Typography size="xs" variant="muted" layoutClassName="mt-1">
          Chỉ xử lý product đang có field nguồn. Field đích sẽ bị ghi đè nếu đã tồn tại.
        </Typography>
        <Box layoutClassName="mt-3 grid gap-3 sm:grid-cols-2">
          <Box>
            <Typography size="xs" layoutClassName="mb-1 font-medium">Field cũ</Typography>
            <Input value={renameFrom} onChange={(e) => setRenameFrom(e.target.value)} disabled={renameBusy} size="sm" containerClassName="w-full" />
          </Box>
          <Box>
            <Typography size="xs" layoutClassName="mb-1 font-medium">Field mới</Typography>
            <Input value={renameTo} onChange={(e) => setRenameTo(e.target.value)} disabled={renameBusy} size="sm" containerClassName="w-full" />
          </Box>
        </Box>
        <Button
          type="button"
          variant="secondary"
          className="mt-3"
          onClick={() => void runRename()}
          disabled={renameBusy}
          leftIcon={renameBusy ? busyIcon(true) : <Copy className="h-4 w-4" />}
          iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
          sizeClassName="px-4 py-2"
          roundedClassName="rounded-lg"
          layoutClassName="inline-flex items-center gap-2"
        >
          Đổi tên field
        </Button>
      </Card>

      <Box layoutClassName="grid gap-4 lg:grid-cols-2">
        <Card padding="md" roundedClassName="rounded-lg" borderClassName="border-slate-200 dark:border-slate-700">
          <Typography size="sm" layoutClassName="font-semibold">Kiểm tra trùng theo field</Typography>
          <Box layoutClassName="mt-3">
            <Typography size="xs" layoutClassName="mb-1 font-medium">Field</Typography>
            <Input value={dupFieldPath} onChange={(e) => setDupFieldPath(e.target.value)} disabled={dupBusy} size="sm" containerClassName="w-full" />
          </Box>
          <Box layoutClassName="mt-2 flex flex-col gap-2">
            <Checkbox
              label="Chuẩn hóa chuỗi (trim + lowercase) khi so sánh"
              checked={dupNormalize}
              onChange={(e) => setDupNormalize(e.target.checked)}
              disabled={dupBusy}
            />
            <Checkbox label="Bỏ qua giá trị rỗng" checked={dupSkipEmpty} onChange={(e) => setDupSkipEmpty(e.target.checked)} disabled={dupBusy} />
          </Box>
          <Button
            type="button"
            variant="secondary"
            className="mt-3"
            onClick={() => void runDupCheck()}
            disabled={dupBusy}
            leftIcon={dupBusy ? busyIcon(true) : <Search className="h-4 w-4" />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
            sizeClassName="px-4 py-2"
            roundedClassName="rounded-lg"
            layoutClassName="inline-flex items-center gap-2"
          >
            Quét trùng
          </Button>
          {dupResult ? (
            <Box
              layoutClassName="mt-3 max-h-48 overflow-auto p-3 font-mono text-xs"
              roundedClassName="rounded-lg"
              backgroundClassName="bg-slate-900"
              textClassName="text-slate-100 whitespace-pre-wrap"
            >
              {dupResult}
            </Box>
          ) : null}
        </Card>

        <Card padding="md" roundedClassName="rounded-lg" borderClassName="border-slate-200 dark:border-slate-700">
          <Typography size="sm" layoutClassName="font-semibold">Product thiếu field</Typography>
          <Box layoutClassName="mt-3">
            <Typography size="xs" layoutClassName="mb-1 font-medium">Field bắt buộc</Typography>
            <Input value={missFieldPath} onChange={(e) => setMissFieldPath(e.target.value)} disabled={missBusy} size="sm" containerClassName="w-full" />
          </Box>
          <Button
            type="button"
            variant="secondary"
            className="mt-3"
            onClick={() => void runMissingCheck()}
            disabled={missBusy}
            leftIcon={missBusy ? busyIcon(true) : <Search className="h-4 w-4" />}
            iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
            sizeClassName="px-4 py-2"
            roundedClassName="rounded-lg"
            layoutClassName="inline-flex items-center gap-2"
          >
            Kiểm tra
          </Button>
          {missResult ? (
            <Box
              layoutClassName="mt-3 max-h-48 overflow-auto p-3 font-mono text-xs"
              roundedClassName="rounded-lg"
              backgroundClassName="bg-slate-900"
              textClassName="text-slate-100 whitespace-pre-wrap"
            >
              {missResult}
            </Box>
          ) : null}
        </Card>
      </Box>

      <Card padding="md" roundedClassName="rounded-lg" borderClassName="border-slate-200 dark:border-slate-700">
        <Typography size="sm" layoutClassName="font-semibold">Audit nhanh: name rỗng</Typography>
        <Typography size="xs" variant="muted" layoutClassName="mt-1">
          Liệt kê document không có tên hiển thị hợp lệ (field <Typography as="span" size="xs" layoutClassName="font-mono">name</Typography>).
        </Typography>
        <Button
          type="button"
          variant="secondary"
          className="mt-3"
          onClick={() => void runAuditNames()}
          disabled={auditBusy}
          leftIcon={auditBusy ? busyIcon(true) : <Search className="h-4 w-4" />}
          iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
          sizeClassName="px-4 py-2"
          roundedClassName="rounded-lg"
          layoutClassName="inline-flex items-center gap-2"
        >
          Chạy audit
        </Button>
        {auditResult ? (
          <Box
            layoutClassName="mt-3 max-h-40 overflow-auto p-3 font-mono text-xs"
            roundedClassName="rounded-lg"
            backgroundClassName="bg-slate-900"
            textClassName="text-slate-100 whitespace-pre-wrap"
          >
            {auditResult}
          </Box>
        ) : null}
      </Card>

      <Card padding="md" roundedClassName="rounded-lg" borderClassName="border-slate-200 dark:border-slate-700">
        <Typography size="sm" layoutClassName="font-semibold">Xuất JSON (backup / chỉnh sửa ngoài)</Typography>
        <Button
          type="button"
          variant="secondary"
          className="mt-3"
          onClick={() => void runExport()}
          disabled={exportBusy}
          leftIcon={exportBusy ? busyIcon(true) : <Download className="h-4 w-4" />}
          iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
          sizeClassName="px-4 py-2"
          roundedClassName="rounded-lg"
          layoutClassName="inline-flex items-center gap-2"
        >
          Tải products.json
        </Button>
      </Card>
    </Box>
  );
};

const BadgeStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box
    layoutClassName="rounded-lg px-3 py-2"
    borderClassName="border border-violet-200 dark:border-violet-800"
    backgroundClassName="bg-white/80 dark:bg-slate-900/40"
  >
    <Typography size="xs" variant="muted">
      {label}
    </Typography>
    <Typography size="sm" layoutClassName="font-semibold">
      {value}
    </Typography>
  </Box>
);

export default ProductDatabaseToolsPanel;

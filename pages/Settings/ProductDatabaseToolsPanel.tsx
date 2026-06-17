import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Copy,
  Download,
  Image as ImageIcon,
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
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import Textarea from '@/components/ui/Textarea';
import Typography from '@/components/ui/Typography';
import { fetchProducts, syncAllProductImagesToOrders } from '@/services/productService';

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
  refreshStatsNonce?: number;
}

const ProductDatabaseToolsPanel: React.FC<ProductDatabaseToolsPanelProps> = ({
  onMutate,
  refreshStatsNonce = 0,
}) => {
  const [, setStatsLoading] = useState(false);
  const [, setStats] = useState<{ total: number; active: number; inactive: number } | null>(null);

  const [simpleSearchField, setSimpleSearchField] = useState('name');
  const [simpleSearchKeyword, setSimpleSearchKeyword] = useState('');
  const [simpleSearchResult, setSimpleSearchResult] = useState('');
  const [simpleSearchBusy, setSimpleSearchBusy] = useState(false);

  const [imageSyncBusy, setImageSyncBusy] = useState(false);
  const [imageSyncResult, setImageSyncResult] = useState<string>('');
  const [imageSyncIncludeName, setImageSyncIncludeName] = useState(true);

  const runImageSync = async () => {
    const labelExtra = imageSyncIncludeName ? '(và tên)' : '';
    if (
      !window.confirm(
        `Quét tất cả đơn hàng và đồng bộ ảnh sản phẩm ${labelExtra} từ collection products?\n\nThao tác này ghi đè item.image (và item.name nếu chọn) trên các order có sản phẩm tương ứng. Không ảnh hưởng giá / số lượng / lịch sử thanh toán.`,
      )
    ) {
      return;
    }
    setImageSyncBusy(true);
    setImageSyncResult('');
    try {
      const res = await syncAllProductImagesToOrders({ includeName: imageSyncIncludeName });
      const msg =
        `Quét ${res.ordersScanned} đơn hàng\n` +
        `→ Cập nhật ${res.ordersUpdated} đơn\n` +
        `→ Sửa ${res.itemsFixed} item`;
      setImageSyncResult(msg);
      toast.success(`Đã đồng bộ ${res.ordersUpdated} đơn (${res.itemsFixed} item)`);
    } catch (e) {
      console.error(e);
      const errMsg = e instanceof Error ? e.message : String(e);
      setImageSyncResult(`Lỗi: ${errMsg}`);
      toast.error('Đồng bộ thất bại — xem console để biết chi tiết');
    } finally {
      setImageSyncBusy(false);
    }
  };

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const products = await fetchProducts();
      let active = 0;
      let inactive = 0;
      products.forEach((p) => {
        if ((p as { status?: string }).status === 'inactive') inactive += 1;
        else active += 1;
      });
      setStats({ total: products.length, active, inactive });
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

  const runSimpleSearch = async () => {
    const field = simpleSearchField.trim();
    const keyword = simpleSearchKeyword.trim().toLowerCase();
    if (!field) {
      toast.error('Vui lòng chọn field');
      return;
    }
    if (!keyword) {
      toast.error('Vui lòng nhập từ khóa');
      return;
    }

    setSimpleSearchBusy(true);
    setSimpleSearchResult('');
    try {
      const products = await fetchProducts();
      const hits: string[] = [];

      products.forEach((p) => {
        const data = p as unknown as FirestoreDocData;
        const value = getAtPath(data, field);
        const text = toComparable(value, true);
        if (text.includes(keyword)) {
          const name = String(data.name ?? '(no name)');
          hits.push(`${String(data.id ?? '')} | ${name} | ${text}`);
        }
      });

      setSimpleSearchResult(
        hits.length > 0
          ? `Tìm thấy ${hits.length} kết quả\n\n${hits.join('\n')}`
          : 'Không tìm thấy kết quả phù hợp.',
      );
      toast.success('Đã tìm xong');
    } catch (e) {
      console.error(e);
      toast.error('Không thể tìm kiếm dữ liệu');
    } finally {
      setSimpleSearchBusy(false);
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
        <Box layoutClassName="flex items-center gap-2">
          <Package className="h-5 w-5 text-violet-600 dark:text-violet-300" />
          <Typography size="sm" layoutClassName="font-semibold text-violet-900 dark:text-violet-100">
            Công cụ database đơn giản
          </Typography>
        </Box>
        <Typography size="xs" variant="muted" layoutClassName="mt-2 text-violet-900/80 dark:text-violet-200/80">
          Chọn field và tìm kiếm trong collection <span className="font-mono text-[11px]">products</span>.
        </Typography>
      </Card>

      <Card padding="md" roundedClassName="rounded-lg" borderClassName="border-slate-200 dark:border-slate-700">
        <Typography size="sm" layoutClassName="font-semibold">Tìm kiếm theo field</Typography>
        <Box layoutClassName="mt-3 grid gap-3 md:grid-cols-2">
          <Box>
            <Typography size="xs" layoutClassName="mb-1 font-medium">Field</Typography>
            <Select fullWidth value={simpleSearchField} onChange={(e) => setSimpleSearchField(e.target.value)}>
              <option value="name">name</option>
              <option value="category">category</option>
              <option value="status">status</option>
              <option value="price">price</option>
              <option value="image">image</option>
              <option value="description">description</option>
              <option value="tags">tags</option>
              <option value="createdAt">createdAt</option>
            </Select>
          </Box>
          <Box>
            <Typography size="xs" layoutClassName="mb-1 font-medium">Từ khóa</Typography>
            <Input
              value={simpleSearchKeyword}
              onChange={(e) => setSimpleSearchKeyword(e.target.value)}
              placeholder="Nhập từ khóa..."
              disabled={simpleSearchBusy}
              size="sm"
              containerClassName="w-full"
            />
          </Box>
        </Box>
        <Button
          type="button"
          variant="primary"
          className="mt-3"
          onClick={() => void runSimpleSearch()}
          disabled={simpleSearchBusy}
          leftIcon={simpleSearchBusy ? busyIcon(true) : <Search className="h-4 w-4" />}
          iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
          sizeClassName="px-4 py-2"
          roundedClassName="rounded-lg"
          layoutClassName="inline-flex items-center gap-2"
        >
          {simpleSearchBusy ? 'Đang tìm...' : 'Tìm kiếm'}
        </Button>

        {simpleSearchResult ? (
          <Box
            layoutClassName="mt-3 max-h-72 overflow-auto p-3 font-mono text-xs"
            roundedClassName="rounded-lg"
            backgroundClassName="bg-slate-900"
            textClassName="text-slate-100 whitespace-pre-wrap"
          >
            {simpleSearchResult}
          </Box>
        ) : null}
      </Card>

      <Card padding="md" roundedClassName="rounded-lg" borderClassName="border-slate-200 dark:border-slate-700">
        <Box layoutClassName="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-primary-500" />
          <Typography size="sm" layoutClassName="font-semibold">
            Đồng bộ ảnh sản phẩm với đơn hàng
          </Typography>
        </Box>
        <Typography size="xs" variant="muted" layoutClassName="mt-1.5">
          Quét toàn bộ đơn hàng → đối chiếu <span className="font-mono text-[11px]">item.id</span> với
          collection <span className="font-mono text-[11px]">products</span> → ghi đè
          <span className="font-mono text-[11px]"> item.image</span> nếu đã đổi.
          Không thay đổi giá / số lượng / trạng thái.
        </Typography>
        <Box layoutClassName="mt-3 flex flex-wrap items-center gap-3">
          <Checkbox
            checked={imageSyncIncludeName}
            onChange={(e) => setImageSyncIncludeName(e.target.checked)}
            label="Đồng bộ luôn cả tên sản phẩm"
            containerClassName="text-sm text-slate-600 dark:text-slate-400"
          />
        </Box>
        <Button
          type="button"
          variant="primary"
          className="mt-3"
          onClick={() => void runImageSync()}
          disabled={imageSyncBusy}
          leftIcon={imageSyncBusy ? busyIcon(true) : <ImageIcon className="h-4 w-4" />}
          iconClassName="inline-flex shrink-0 [&_svg]:h-4 [&_svg]:w-4"
          sizeClassName="px-4 py-2"
          roundedClassName="rounded-lg"
          layoutClassName="inline-flex items-center gap-2"
        >
          {imageSyncBusy ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}
        </Button>

        {imageSyncResult ? (
          <Box
            layoutClassName="mt-3 max-h-72 overflow-auto p-3 font-mono text-xs"
            roundedClassName="rounded-lg"
            backgroundClassName="bg-slate-900"
            textClassName="text-slate-100 whitespace-pre-wrap"
          >
            {imageSyncResult}
          </Box>
        ) : null}
      </Card>
    </Box>
  );
};

export default ProductDatabaseToolsPanel;

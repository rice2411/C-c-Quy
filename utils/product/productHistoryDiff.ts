/**
 * productHistoryDiff — chuyển 1 ProductVersion (before/changes/after thô từ SQL)
 * thành danh sách thay đổi đọc được tiếng Việt: { label, before, after }.
 *
 * Dữ liệu thô coi là untrusted: giá có thể là string từ SQL, ảnh có thể null,
 * mảng có thể là string JSON. Mọi format đều type-guard.
 */
import { formatVND } from '@/utils/format/currencyUtil';
import type { ProductVersion } from '@/types';

/** 1 dòng thay đổi của 1 field trong 1 version. */
export interface ProductFieldChange {
  /** key kỹ thuật (price, costPrice...) — dùng cho React key */
  field: string;
  /** nhãn tiếng Việt hiển thị */
  label: string;
  /** giá trị cũ đã format (đã có '—' nếu rỗng) */
  before: string;
  /** giá trị mới đã format */
  after: string;
}

/** Loại format cho từng field. */
type FieldKind = 'money' | 'status' | 'image' | 'list' | 'text';

interface FieldConfig {
  label: string;
  kind: FieldKind;
}

/** Map key kỹ thuật → nhãn tiếng Việt + cách format. */
const FIELD_CONFIG: Record<string, FieldConfig> = {
  name: { label: 'Tên', kind: 'text' },
  description: { label: 'Mô tả', kind: 'text' },
  price: { label: 'Giá bán', kind: 'money' },
  costPrice: { label: 'Giá vốn', kind: 'money' },
  status: { label: 'Trạng thái', kind: 'status' },
  category: { label: 'Danh mục', kind: 'text' },
  categoryId: { label: 'Danh mục', kind: 'text' },
  tags: { label: 'Tags', kind: 'list' },
  image: { label: 'Ảnh', kind: 'image' },
  gallery: { label: 'Thư viện ảnh', kind: 'image' },
  recipeId: { label: 'Công thức', kind: 'text' },
  cakesPerProduct: { label: 'Số bánh/sản phẩm', kind: 'text' },
  stockUnit: { label: 'Đơn vị tồn kho', kind: 'text' },
  currentStock: { label: 'Tồn kho hiện tại', kind: 'text' },
  lowStockThreshold: { label: 'Ngưỡng cảnh báo tồn', kind: 'text' },
  commissionRate: { label: 'Tỷ lệ hoa hồng', kind: 'text' },
};

const PLACEHOLDER = '—';

const isBlank = (v: unknown): boolean =>
  v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);

/** Ép giá trị (number | string số) về number an toàn; null nếu không phải số. */
const toNumber = (v: unknown): number | null => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
};

/** Coerce về mảng (chấp nhận mảng sẵn hoặc chuỗi JSON mảng). */
const toArray = (v: unknown): unknown[] | null => {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string' && v.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      /* ignore */
    }
  }
  return null;
};

const formatStatus = (v: unknown): string => {
  if (v === 'active' || v === true) return 'Hoạt động';
  if (v === 'inactive' || v === false) return 'Ngừng';
  if (typeof v === 'string' && v) return v;
  return PLACEHOLDER;
};

const formatList = (v: unknown): string => {
  const arr = toArray(v);
  if (!arr || arr.length === 0) return PLACEHOLDER;
  const labels = arr
    .map((x) => (typeof x === 'string' ? x : typeof x === 'number' ? String(x) : ''))
    .filter(Boolean);
  if (labels.length === 0) return `${arr.length} mục`;
  if (labels.length <= 3) return labels.join(', ');
  return `${labels.slice(0, 3).join(', ')} +${labels.length - 3}`;
};

const formatImage = (v: unknown): string => {
  const arr = toArray(v);
  if (arr) return arr.length === 0 ? PLACEHOLDER : `${arr.length} ảnh`;
  return isBlank(v) ? PLACEHOLDER : 'đã đổi ảnh';
};

/** Format 1 giá trị theo loại field. */
const formatValue = (kind: FieldKind, v: unknown): string => {
  if (kind === 'status') return formatStatus(v);
  if (kind === 'image') return formatImage(v);
  if (kind === 'list') return formatList(v);
  if (isBlank(v)) return PLACEHOLDER;
  if (kind === 'money') {
    const n = toNumber(v);
    return n === null ? String(v) : formatVND(n);
  }
  // text
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'Có' : 'Không';
  return JSON.stringify(v);
};

const configFor = (key: string): FieldConfig =>
  FIELD_CONFIG[key] ?? { label: key, kind: 'text' };

/**
 * Tính danh sách thay đổi của 1 version.
 * Ưu tiên `changes` (field đã đổi); lấy before từ `before`, after từ `after` (fallback `changes`).
 */
export const diffProductVersion = (version: ProductVersion): ProductFieldChange[] => {
  const before = (version.before ?? {}) as Record<string, unknown>;
  const after = (version.after ?? {}) as Record<string, unknown>;
  const changes = (version.changes ?? {}) as Record<string, unknown>;

  const changedKeys = Object.keys(changes).length > 0
    ? Object.keys(changes)
    : Object.keys(after);

  const result: ProductFieldChange[] = [];
  for (const key of changedKeys) {
    const cfg = configFor(key);
    const rawBefore = key in before ? before[key] : undefined;
    const rawAfter = key in after ? after[key] : changes[key];

    const beforeStr = formatValue(cfg.kind, rawBefore);
    const afterStr = formatValue(cfg.kind, rawAfter);

    // Bỏ qua nếu cả hai rỗng (không có thông tin thực sự)
    if (beforeStr === PLACEHOLDER && afterStr === PLACEHOLDER) continue;

    result.push({ field: key, label: cfg.label, before: beforeStr, after: afterStr });
  }
  return result;
};

/** Format thời gian chỉnh sửa (vi-VN), '—' nếu thiếu/không hợp lệ. */
export const formatEditedAt = (iso?: string): string => {
  if (!iso) return PLACEHOLDER;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return PLACEHOLDER;
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

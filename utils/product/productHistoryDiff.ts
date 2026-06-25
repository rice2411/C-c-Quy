/**
 * productHistoryDiff — chuyển 1 ProductVersion (before/changes/after thô từ SQL)
 * thành danh sách thay đổi đọc được tiếng Việt: { label, before, after }.
 *
 * Dữ liệu thô coi là untrusted: giá có thể là string từ SQL, ảnh có thể null,
 * mảng có thể là string JSON. Mọi format đều type-guard.
 */
import { formatVND } from '@/utils/format/currencyUtil';
import { parseDateValue } from '@/utils/format/dateUtil';
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
 * So sánh 2 giá trị THÔ (raw before vs after) xem có THỰC SỰ đổi không.
 * Chuẩn hoá trước khi so để tránh "đổi giả" do khác kiểu/format:
 *  - number: "25000" vs 25000 coi như bằng (toNumber).
 *  - mảng/JSON-string: so theo nội dung đã parse (toArray) — tags ["a"] == '["a"]'.
 *  - rỗng: null/undefined/''/[] coi như "rỗng" và bằng nhau (isBlank).
 * So trên raw (không phải string format) để ảnh đổi URL vẫn được giữ:
 * 2 URL khác nhau cùng format thành "đã đổi ảnh" nhưng raw khác → vẫn coi là đổi.
 */
const rawValuesEqual = (a: unknown, b: unknown): boolean => {
  // Cả hai rỗng → coi như bằng (không có thay đổi thực sự).
  if (isBlank(a) && isBlank(b)) return true;
  if (isBlank(a) !== isBlank(b)) return false;

  // Số: so theo giá trị numeric ("25000" == 25000).
  const na = toNumber(a);
  const nb = toNumber(b);
  if (na !== null && nb !== null) return na === nb;
  // Một bên là số, bên kia không parse được số → khác.
  if (na !== null || nb !== null) return false;

  // Mảng / JSON-string mảng: so theo nội dung đã parse.
  const arrA = toArray(a);
  const arrB = toArray(b);
  if (arrA && arrB) {
    if (arrA.length !== arrB.length) return false;
    return arrA.every((x, i) => rawValuesEqual(x, arrB[i]));
  }
  if (arrA || arrB) return false;

  // Còn lại (string/boolean/object): so theo dạng chuẩn hoá ổn định.
  const norm = (v: unknown): string =>
    typeof v === 'string' ? v : JSON.stringify(v);
  return norm(a) === norm(b);
};

/**
 * Tính danh sách thay đổi của 1 version.
 * Ưu tiên `changes` (field đã đổi); lấy before từ `before`, after từ `after` (fallback `changes`).
 * CHỈ giữ field có giá trị THỰC SỰ đổi (so raw before vs after) — BE ghi toàn bộ field
 * mỗi version nên phải tự lọc field không đổi để timeline không hiển thị dòng nhiễu.
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

    // Lọc field KHÔNG đổi: so trên giá trị thô đã chuẩn hoá.
    if (rawValuesEqual(rawBefore, rawAfter)) continue;

    const beforeStr = formatValue(cfg.kind, rawBefore);
    const afterStr = formatValue(cfg.kind, rawAfter);

    // Bỏ qua nếu cả hai rỗng (không có thông tin thực sự)
    if (beforeStr === PLACEHOLDER && afterStr === PLACEHOLDER) continue;

    result.push({ field: key, label: cfg.label, before: beforeStr, after: afterStr });
  }
  return result;
};

/**
 * Format thời gian chỉnh sửa (vi-VN), '—' nếu thiếu/không hợp lệ.
 *
 * LƯU Ý: type `ProductVersion.editedAt` khai báo `string`, NHƯNG runtime có thể là
 * Timestamp-like object — interceptor `services/api/client.ts` (`reviveTimestamps`)
 * biến mọi ISO timestamp từ BE thành `{ seconds, nanoseconds, toDate(), toMillis() }`.
 * Vì vậy nhận `unknown` và uỷ thác cho `parseDateValue` (helper dùng chung) để xử
 * lý đồng nhất cả string ISO, number (ms), Date lẫn Timestamp-like object.
 */
export const formatEditedAt = (value?: unknown): string => {
  const d = parseDateValue(value);
  if (!d || Number.isNaN(d.getTime())) return PLACEHOLDER;
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

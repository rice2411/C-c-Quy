/**
 * Chuẩn hoá tên cho việc dedupe NCC / NVL trong luồng nhập bill.
 *
 * Vấn đề trước đây: `normalizeNameKey` strip mọi ký tự không phải [a-z0-9]
 * khiến "Sữa tươi 1L" và "Sữa tươi 2L" có cùng key, gộp nhầm NVL khác quy cách.
 *
 * Cách mới: tách phần "tên gốc" và "quy cách" (pack) trước khi build key,
 * và đưa đơn vị về dạng chuẩn (canonical) để gộp đúng.
 */

const ACCENT_RE = /[̀-ͯ]/g;

/** Loại bỏ dấu tiếng Việt, lowercase, gộp khoảng trắng. KHÔNG strip số/dấu. */
function stripAccent(input: string): string {
  return input.toLowerCase().normalize('NFD').replace(ACCENT_RE, '');
}

/** Regex bắt cụm "<số> <đơn vị>" trong tên NVL (đã stripAccent). */
const UNIT_TOKEN =
  /(\d+(?:[.,]\d+)?)\s*(kg|kilogam|kilo|gam|gr|g|l|lit|lít|ml|cl|goi|gói|hop|hộp|chai|thung|thùng|lon|cai|cái|cay|cây|tui|túi|bich|bịch|qua|quả)\b/i;

/** Đưa đơn vị đo về dạng chuẩn (đã stripAccent input). */
const UNIT_CANONICAL_MAP: Record<string, string> = {
  ki: 'kg', kilo: 'kg', kilogam: 'kg', kg: 'kg',
  gam: 'g', gr: 'g', g: 'g',
  lit: 'l', l: 'l',
  ml: 'ml', cl: 'cl',
  thung: 'thung',
  chai: 'chai',
  lon: 'lon',
  goi: 'goi',
  hop: 'hop',
  cai: 'cai',
  cay: 'cay',
  tui: 'tui',
  bich: 'tui',  // bịch ≈ túi
  qua: 'qua',
};

/** Trả về unit chuẩn ("kg", "g"…) hoặc null nếu không nhận diện được. */
export function canonicalUnit(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = stripAccent(raw.trim());
  if (!s) return null;
  // Một số bill ghi "1 kg" hoặc "1kg" trong cột unit, lọc số trước.
  const onlyUnit = s.replace(/^\d+(?:[.,]\d+)?\s*/, '').trim();
  return UNIT_CANONICAL_MAP[onlyUnit] ?? UNIT_CANONICAL_MAP[s] ?? null;
}

export interface NormalizedItem {
  /** Tên gốc đã bỏ dấu/quy cách, dùng để fuzzy match phần "tên". */
  base: string;
  /** Pack đã chuẩn hoá ("1l", "500g") hoặc null. */
  pack: string | null;
  /** Key để dedupe: `base` + "|" + `pack` (nếu có). */
  fullKey: string;
}

/**
 * Chuẩn hoá tên NVL.
 * - Tách quy cách (1L, 500g, …) ra `pack`.
 * - Phần còn lại bỏ ký tự đặc biệt, gộp khoảng trắng làm `base`.
 * - `fullKey` ghép cả hai để dùng làm normalizedName trong Firestore.
 */
export function normalizeItem(raw: string): NormalizedItem {
  const cleaned = stripAccent(raw || '');
  const m = cleaned.match(UNIT_TOKEN);
  let pack: string | null = null;
  if (m) {
    const num = m[1].replace(',', '.');
    const unit = UNIT_CANONICAL_MAP[m[2].toLowerCase()] ?? m[2].toLowerCase();
    pack = `${num}${unit}`;
  }
  const base = cleaned
    .replace(UNIT_TOKEN, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const fullKey = pack ? `${base}|${pack}` : base;
  return { base, pack, fullKey };
}

/** Chuẩn hoá tên NCC: chỉ cần bỏ dấu + lowercase + gộp khoảng trắng. */
export function normalizeSupplierKey(raw: string | null | undefined): string {
  const s = stripAccent((raw || '').trim());
  return s.replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * SHA-256 hex của một chuỗi (dùng SubtleCrypto, trình duyệt hiện đại).
 * Dùng để tạo billHash chặn bill trùng.
 */
export async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

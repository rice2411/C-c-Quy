import { SPX_PROVINCES, SPX_WARDS_BY_PROVINCE } from '@/assets/spxAdminList';

/**
 * Tách Tỉnh/Thành + Xã/Phường (theo đúng list chuẩn SPX sau sáp nhập 2025) từ địa chỉ free-text.
 * Rule-based, offline: chuẩn hoá (bỏ dấu, giãn viết tắt) rồi so khớp với SPX_PROVINCES / SPX_WARDS.
 * Không khớp chắc chắn → trả '' để người dùng tự chọn dropdown trên SPX.
 */

/** Bỏ dấu tiếng Việt + đ→d, lowercase, gom về token cách nhau bởi khoảng trắng. */
const normalize = (s: string): string =>
  (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const stripProvincePrefix = (name: string): string => name.replace(/^(Tỉnh|Thành phố)\s+/i, '');
const stripWardPrefix = (name: string): string => name.replace(/^(Phường|Xã|Thị trấn|Đặc khu)\s+/i, '');

// Alias viết tắt phổ biến → tên tỉnh chuẩn (dạng đã normalize). Chỉ dùng alias đủ đặc trưng.
const PROVINCE_ALIASES: Record<string, string> = {
  'ho chi minh': 'Thành phố Hồ Chí Minh',
  hcm: 'Thành phố Hồ Chí Minh',
  tphcm: 'Thành phố Hồ Chí Minh',
  hcmc: 'Thành phố Hồ Chí Minh',
  'sai gon': 'Thành phố Hồ Chí Minh',
  saigon: 'Thành phố Hồ Chí Minh',
  'ha noi': 'Thành phố Hà Nội',
  hanoi: 'Thành phố Hà Nội',
  'da nang': 'Thành phố Đà Nẵng',
  danang: 'Thành phố Đà Nẵng',
  'hai phong': 'Thành phố Hải Phòng',
  'can tho': 'Thành phố Cần Thơ',
  hue: 'Thành phố Huế',
};

// Tên quận CŨ (trước sáp nhập) → suy ra Tỉnh/Thành, vì địa chỉ cũ hay chỉ ghi quận không ghi tỉnh.
// Chỉ dùng để ĐOÁN TỈNH (cột D); Xã vẫn khớp riêng. Toàn tên đặc trưng, ít trùng.
const HCM_HINTS = [
  'go vap', 'tan binh', 'tan phu', 'binh thanh', 'phu nhuan', 'thu duc', 'binh tan',
  'hoc mon', 'cu chi', 'nha be', 'binh chanh', 'can gio',
];
const HANOI_HINTS = [
  'dong da', 'ba dinh', 'hoan kiem', 'hai ba trung', 'cau giay', 'thanh xuan', 'tay ho',
  'long bien', 'hoang mai', 'ha dong', 'nam tu liem', 'bac tu liem', 'gia lam', 'dong anh',
];

// Bảng khoá tỉnh dựng 1 lần: {key (normalized), province, len}. Ưu tiên key dài (đặc trưng hơn).
type ProvKey = { key: string; province: string; len: number };
let provKeysCache: ProvKey[] | null = null;
const provKeys = (): ProvKey[] => {
  if (provKeysCache) return provKeysCache;
  const keys: ProvKey[] = [];
  for (const p of SPX_PROVINCES) {
    const k = normalize(stripProvincePrefix(p));
    if (k) keys.push({ key: k, province: p, len: k.length });
  }
  for (const [alias, province] of Object.entries(PROVINCE_ALIASES)) {
    keys.push({ key: alias, province, len: alias.length });
  }
  // Quận cũ có tên → suy tỉnh.
  for (const h of HCM_HINTS) keys.push({ key: h, province: 'Thành phố Hồ Chí Minh', len: h.length });
  for (const h of HANOI_HINTS) keys.push({ key: h, province: 'Thành phố Hà Nội', len: h.length });
  // "Quận N" đánh số ⇒ hầu như chắc chắn là HCM (Hà Nội dùng quận có TÊN, không đánh số).
  for (let n = 1; n <= 12; n++) {
    for (const k of [`quan ${n}`, `q ${n}`, `q${n}`]) {
      keys.push({ key: k, province: 'Thành phố Hồ Chí Minh', len: k.length });
    }
  }
  keys.sort((a, b) => b.len - a.len); // dài trước
  provKeysCache = keys;
  return keys;
};

/** True nếu `key` xuất hiện như 1 cụm token trong `hay` (biên token). */
const containsPhrase = (hay: string, key: string): boolean => {
  const re = new RegExp(`(^| )${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`);
  return re.test(hay);
};

/** Khớp Tỉnh: chọn key khớp DÀI nhất, ưu tiên vị trí xuất hiện muộn nhất (tỉnh thường ở cuối). */
export const matchProvince = (address: string): string => {
  const hay = normalize(address);
  if (!hay) return '';
  let best: { province: string; len: number; pos: number } | null = null;
  for (const { key, province, len } of provKeys()) {
    if (!containsPhrase(hay, key)) continue;
    const pos = hay.lastIndexOf(key);
    if (!best || len > best.len || (len === best.len && pos > best.pos)) {
      best = { province, len, pos };
    }
  }
  return best?.province ?? '';
};

/** Khớp Xã/Phường trong phạm vi tỉnh đã khớp: chọn tên khớp DÀI nhất (≥4 ký tự) để tránh nhiễu. */
export const matchWard = (address: string, province: string): string => {
  const wards = SPX_WARDS_BY_PROVINCE[province];
  if (!wards) return '';
  const hay = normalize(address);
  if (!hay) return '';
  let best: { ward: string; len: number } | null = null;
  for (const w of wards) {
    const key = normalize(stripWardPrefix(w));
    if (key.length < 4) continue;
    if (!containsPhrase(hay, key)) continue;
    if (!best || key.length > best.len) best = { ward: w, len: key.length };
  }
  return best?.ward ?? '';
};

/** Tách cả Tỉnh + Xã từ 1 địa chỉ. Xã chỉ tìm khi đã có Tỉnh. */
export const matchAddress = (address: string): { province: string; ward: string } => {
  const province = matchProvince(address);
  const ward = province ? matchWard(address, province) : '';
  return { province, ward };
};

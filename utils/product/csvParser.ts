/**
 * CSV parser cho product import.
 * - Hỗ trợ quoted fields (kể cả comma trong field, escaped "")
 * - Tự strip BOM
 */

/** Parse raw CSV text → array of rows */
export const parseCsvText = (text: string): string[][] => {
  // Strip BOM
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ',') { cur.push(field); field = ''; i++; continue; }
    if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      cur.push(field); rows.push(cur); cur = []; field = '';
      i++; continue;
    }
    field += c; i++;
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
};

/** Mapping header aliases → canonical column key */
export interface ProductColumnIndices {
  id: number;
  name: number;
  category: number;
  price: number;
  cost: number;
  status: number;
  tags: number;
  desc: number;
  stockUnit: number;
  stock: number;
  threshold: number;
}

export const detectProductColumns = (headers: string[]): ProductColumnIndices => {
  const lc = headers.map((h) => h.trim().toLowerCase());
  return {
    id: lc.findIndex((h) => h === 'id'),
    name: lc.findIndex((h) => ['tên', 'ten', 'name'].includes(h)),
    category: lc.findIndex((h) => ['category', 'danh mục', 'danh muc'].includes(h)),
    price: lc.findIndex((h) => ['giá bán', 'gia ban', 'price', 'giá'].includes(h)),
    cost: lc.findIndex((h) => ['giá vốn', 'gia von', 'cost', 'costprice'].includes(h)),
    status: lc.findIndex((h) => ['status', 'trạng thái', 'trang thai'].includes(h)),
    tags: lc.findIndex((h) => ['tags', 'tag', 'badges'].includes(h)),
    desc: lc.findIndex((h) => ['description', 'mô tả', 'mo ta'].includes(h)),
    stockUnit: lc.findIndex((h) => ['stockunit', 'đơn vị', 'don vi', 'unit'].includes(h)),
    stock: lc.findIndex((h) => ['stock', 'tồn kho', 'ton kho', 'currentstock'].includes(h)),
    threshold: lc.findIndex((h) => ['threshold', 'ngưỡng', 'nguong', 'lowstock'].includes(h)),
  };
};

/** Safely read a cell by index (returns trimmed string or '') */
export const readCell = (cells: string[], idx: number): string =>
  idx >= 0 && idx < cells.length ? cells[idx].trim() : '';

/** Parse số từ chuỗi có thể chứa ký tự "₫,. " — trả về undefined nếu rỗng */
export const parseNumberCell = (raw: string): number | undefined => {
  if (!raw) return undefined;
  const cleaned = raw.replace(/[^\d.,-]/g, '').replace(',', '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
};

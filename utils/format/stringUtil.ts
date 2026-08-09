/**
 * Chuẩn hoá chuỗi để so khớp tìm kiếm (lowercase, trim). Chịu được MỌI kiểu:
 * chuỗi thường, null/undefined, và Timestamp-like (apiClient revive field ISO thành
 * object có .toDate()) — trước đây gọi `.trim()` trên object → crash search.
 */
export const normalizeSearchText = (value: unknown): string => {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim().toLowerCase();
  const tsLike = value as { toDate?: () => Date };
  if (typeof tsLike.toDate === 'function') {
    try {
      return tsLike.toDate().toISOString().toLowerCase();
    } catch {
      /* rơi xuống String() bên dưới */
    }
  }
  return String(value).trim().toLowerCase();
};

/** Bỏ dấu tiếng Việt + đ→d, lowercase, gom token — dùng cho so khớp gần đúng. */
const stripDiacritics = (value: string | null | undefined): string =>
  (value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Độ tương đồng 2 chuỗi (0..1) theo hệ số Dice trên cặp ký tự (bigram), sau khi bỏ dấu.
 * Dùng để gợi ý/tự chọn nguyên liệu khớp ≥ ngưỡng (vd 0.7). Khớp hệt = 1.
 */
export const similarityScore = (a: string | null | undefined, b: string | null | undefined): number => {
  const x = stripDiacritics(a).replace(/\s+/g, ' ');
  const y = stripDiacritics(b).replace(/\s+/g, ' ');
  if (!x || !y) return 0;
  if (x === y) return 1;
  const bigrams = (s: string): string[] => {
    const out: string[] = [];
    for (let i = 0; i < s.length - 1; i++) out.push(s.slice(i, i + 2));
    return out;
  };
  const ax = bigrams(x);
  const ay = bigrams(y);
  if (ax.length === 0 || ay.length === 0) return 0;
  const counts = new Map<string, number>();
  ax.forEach((g) => counts.set(g, (counts.get(g) ?? 0) + 1));
  let inter = 0;
  ay.forEach((g) => {
    const c = counts.get(g) ?? 0;
    if (c > 0) {
      inter += 1;
      counts.set(g, c - 1);
    }
  });
  return (2 * inter) / (ax.length + ay.length);
};

/** NVL khớp gần đúng nhất trong danh sách (≥ ngưỡng) cho 1 tên. null nếu không đạt. */
export const bestMaterialMatch = <T extends { name: string }>(
  name: string,
  materials: T[],
  threshold = 0.7,
): { item: T; score: number } | null => {
  let best: { item: T; score: number } | null = null;
  for (const m of materials) {
    const score = similarityScore(name, m.name);
    if (score >= threshold && (!best || score > best.score)) best = { item: m, score };
  }
  return best;
};

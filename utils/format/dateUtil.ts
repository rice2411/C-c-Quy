/**
 * Format ngày tháng
 * @param value - Giá trị ngày tháng
 * @returns Ngày tháng
 */

export const formatDateOnly = (value: any) => {
  const date = parseDateValue(value);
  return date ? date.toLocaleDateString() : "--";
};

/**
 * Ngày dạng `YYYY-MM-DD` an toàn cho MỌI kiểu (string ISO, Date, Firestore Timestamp object).
 * Thay cho `value.slice(0, 10)` — vốn crash khi value là object (Timestamp). Trả `—` nếu không parse được.
 */
export const formatDateISO = (value: any): string => {
  const d = parseDateValue(value);
  if (!d) return "—";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/**
 * Format ngày tháng thời gian
 * @param value - Giá trị ngày tháng thời gian
 * @returns Ngày tháng thời gian
 */
export const formatDateTime = (value: any) => {
  const date = parseDateValue(value);
  return date
    ? date.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : "--";
};

/**
 * Parser ngày tháng
 * @param value - Giá trị ngày tháng
 * @returns Ngày tháng
 */
export const parseDateValue = (value: any) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    // Parse YYYY-MM-DD as local date to avoid timezone shift.
    if (typeof value === "string") {
      const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (dateOnlyMatch) {
        const [, y, m, d] = dateOnlyMatch;
        return new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0);
      }
    }
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === "object" && typeof value.toDate === "function") {
    try {
      return value.toDate();
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Thời điểm nhập phiếu từ chuỗi ISO (map từ Firestore Timestamp.toDate()).
 */
export function formatImportedAt(iso: string | undefined): string {
  if (!iso) return '—';
  const date = parseDateValue(iso);
  if (!date) return '—';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

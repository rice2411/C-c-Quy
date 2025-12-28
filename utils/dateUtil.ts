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

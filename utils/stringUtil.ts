/** Chuẩn hoá chuỗi để so khớp tìm kiếm (lowercase, trim). */
export const normalizeSearchText = (value: string | null | undefined): string =>
  (value || '').trim().toLowerCase();

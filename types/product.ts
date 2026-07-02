export interface ProductMaterial {
  materialId: string;
  quantity: number;
}

/** 1 size của sản phẩm: tên + giá + ảnh + số cái (combo). Giá dòng đơn lấy theo size chọn. */
export interface ProductSize {
  name: string;
  price: number;
  image?: string;
  /** Số cái của combo (vd 3, 5). >1 → khi bán phân bổ vị theo số cái (stepper). */
  count?: number;
}

/** 1 biến thể vị: tên + màu + ảnh riêng (từ gallery) + giá riêng (tùy chọn). Khai báo per-sản phẩm. */
export interface ProductFlavorVariant {
  name: string;
  color?: string;
  image?: string;
  price?: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  /** Ảnh phụ (gallery) — các góc chụp/chi tiết khác. Primary vẫn là `image` */
  gallery?: string[];
  category: string;
  tags?: string[];
  /** Vị (multi-select) — không ảnh hưởng giá */
  flavors?: string[];
  /** Size (biến thể giá) — giá dòng đơn lấy theo size chọn */
  sizes?: ProductSize[];
  /** Biến thể vị: mỗi vị có ảnh + giá riêng (giá dòng = tổng vị chọn) */
  flavorVariants?: ProductFlavorVariant[];
  description?: string;
  status: 'active' | 'inactive';
  materials?: ProductMaterial[];
  createdAt?: string;
  /** Giá vốn / cost price */
  costPrice?: number;
  /** Tỷ lệ hoa hồng cố định (legacy / override), VD: 0.1 = 10% trên giá bán */
  commissionRate?: number;
  /** Badge IDs gán cho sản phẩm */
  badgeIds?: string[];
  /** Đơn vị tồn kho */
  stockUnit?: string;
  /** Số lượng tồn kho hiện tại */
  currentStock?: number;
  /** Ngưỡng cảnh báo low stock */
  lowStockThreshold?: number;
}

export interface ProductVersion {
  id: string;
  productId: string;
  action: 'update' | string;
  editedAt?: string;
  before?: Record<string, unknown>;
  changes?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

/** Sản phẩm tính giá theo tổng vị chọn khi: không có size + có ≥1 vị đặt giá. */
export const productUsesFlavorPricing = (p: {
  sizes?: ProductSize[];
  flavorVariants?: ProductFlavorVariant[];
}): boolean =>
  (!p.sizes || p.sizes.length === 0) &&
  !!p.flavorVariants?.some((v) => (v.price ?? 0) > 0);

/** Tổng giá các vị đang chọn (theo flavorVariants). */
export const flavorSumPrice = (
  p: { flavorVariants?: ProductFlavorVariant[] },
  selected: string[],
): number =>
  (p.flavorVariants ?? [])
    .filter((v) => selected.includes(v.name))
    .reduce((s, v) => s + (v.price ?? 0), 0);

/** Ảnh riêng của 1 vị (nếu có). */
export const flavorImage = (
  p: { flavorVariants?: ProductFlavorVariant[] },
  name: string,
): string | undefined =>
  (p.flavorVariants ?? []).find((v) => v.name === name)?.image;

/** Màu của 1 vị theo khai báo trong sản phẩm (fallback xám). */
export const flavorVariantColor = (
  p: { flavorVariants?: ProductFlavorVariant[] },
  name: string,
): string =>
  (p.flavorVariants ?? []).find((v) => v.name === name)?.color || '#64748b';

/** Ảnh của 1 size (nếu có). */
export const sizeImage = (
  p: { sizes?: ProductSize[] },
  name?: string,
): string | undefined =>
  name ? (p.sizes ?? []).find((s) => s.name === name)?.image : undefined;

/** Số cái của 1 size (combo). undefined nếu không phải combo nhiều cái. */
export const sizeCount = (
  p: { sizes?: ProductSize[] },
  name?: string,
): number | undefined =>
  name ? (p.sizes ?? []).find((s) => s.name === name)?.count : undefined;

/** Gom mảng vị (có lặp) thành [{name, qty}] để hiển thị: vd ['M','M','S'] → [{M,2},{S,1}]. */
export const groupFlavors = (flavors?: string[]): { name: string; qty: number }[] => {
  const m = new Map<string, number>();
  (flavors ?? []).forEach((f) => m.set(f, (m.get(f) || 0) + 1));
  return Array.from(m.entries()).map(([name, qty]) => ({ name, qty }));
};

/**
 * Ảnh nên hiển thị cho 1 dòng đơn theo biến thể khách chọn:
 * ưu tiên ảnh size → ảnh vị (đầu tiên có ảnh) → ảnh gốc sản phẩm.
 */
export const orderLineImage = (
  p: { image?: string; sizes?: ProductSize[]; flavorVariants?: ProductFlavorVariant[] },
  opts: { size?: string; flavors?: string[] },
): string | undefined => {
  const si = sizeImage(p, opts.size);
  if (si) return si;
  const fi = (opts.flavors ?? []).map((n) => flavorImage(p, n)).find(Boolean);
  if (fi) return fi;
  return p.image;
};

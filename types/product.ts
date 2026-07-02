export interface ProductMaterial {
  materialId: string;
  quantity: number;
}

/** 1 size của sản phẩm: tên + giá. Giá dòng đơn lấy theo size chọn. */
export interface ProductSize {
  name: string;
  price: number;
}

/** 1 biến thể vị: tên + ảnh riêng (từ gallery) + giá riêng (tùy chọn). */
export interface ProductFlavorVariant {
  name: string;
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

export interface ProductMaterial {
  materialId: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  tags?: string[];
  description?: string;
  status: 'active' | 'inactive';
  materials?: ProductMaterial[];
  createdAt?: string;
  /** Giá vốn / cost price (dùng để tính margin & hoa hồng nhóm) */
  costPrice?: number;
  /** Tỷ lệ hoa hồng cố định (legacy / override), VD: 0.1 = 10% trên giá bán */
  commissionRate?: number;
  /** Badge IDs gán cho sản phẩm (Bán chạy / Mới / Sale...) — từ Settings → Badges */
  badgeIds?: string[];
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

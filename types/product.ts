export interface ProductRecipe {
  recipeId: string;
  quantity: number;
  /** Giá mỗi set (VND), do user nhập. Nếu không có thì dùng giá tính từ công thức. */
  pricePerSet?: number;
}

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
  description?: string;
  status: 'active' | 'inactive';
  /** Số lượng bánh trong mỗi sản phẩm (dùng cho gợi ý giá). */
  cakesPerProduct?: number;
  recipes?: ProductRecipe[];
  materials?: ProductMaterial[];
  createdAt?: string;
}

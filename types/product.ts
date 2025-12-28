export interface ProductRecipe {
  recipeId: string;
  quantity: number;
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
  recipes?: ProductRecipe[];
  materials?: ProductMaterial[];
  createdAt?: string;
}

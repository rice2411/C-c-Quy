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
  materials?: ProductMaterial[];
  createdAt?: string;
}

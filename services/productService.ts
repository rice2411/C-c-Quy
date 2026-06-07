import { apiClient } from '@/services/api/client';
import { Product, ProductVersion } from '@/types';

export const fetchProducts = async (): Promise<Product[]> => {
  return (await apiClient.get('/products')).data as Product[];
};

export const addProduct = async (productData: Omit<Product, 'id'>): Promise<void> => {
  await apiClient.post('/products', productData);
};

export const updateProduct = async (id: string, productData: Partial<Product>): Promise<void> => {
  await apiClient.patch(`/products/${id}`, productData);
};

/**
 * Xoá giá cost của sản phẩm — đưa sản phẩm ra khỏi danh sách "đã có hoa hồng".
 */
export const removeProductCostPrice = async (id: string): Promise<void> => {
  await apiClient.delete(`/products/${id}/cost-price`);
};

export const deleteProduct = async (id: string): Promise<void> => {
  await apiClient.delete(`/products/${id}`);
};

export const fetchProductVersions = async (productId: string): Promise<ProductVersion[]> => {
  return (await apiClient.get(`/products/${productId}/versions`)).data as ProductVersion[];
};

/**
 * Đồng bộ thủ công: với mọi đơn hàng, ghi đè item.image (và optionally item.name)
 * bằng giá trị hiện tại của product nếu khác.
 *
 * Trả về thống kê: số order quét, số order được update, số item được sửa.
 */
export async function syncAllProductImagesToOrders(options?: {
  includeName?: boolean;
}): Promise<{ ordersScanned: number; ordersUpdated: number; itemsFixed: number }> {
  const includeName = options?.includeName ?? true;
  return (
    await apiClient.post('/admin-db/sync-product-images', { includeName })
  ).data as { ordersScanned: number; ordersUpdated: number; itemsFixed: number };
}

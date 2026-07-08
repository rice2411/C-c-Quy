/**
 * React Query hooks cho domain Products (epic #58 — migrate data-fetching).
 *
 * - queryFn/mutationFn GỌI THẲNG service hiện có (productService) — giữ nguyên
 *   fallback + revive Timestamp ở tầng dưới, KHÔNG viết lại HTTP.
 * - Mọi query `enabled: !!currentUser` để tránh chạy trước khi auth ready → 401.
 * - Sau mutation invalidate `qk.products.all` (prefix match → xoá luôn versions).
 * - KHÔNG nuốt lỗi: caller (component) bắt error / dùng `error` để toast.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Product, ProductVersion } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { qk } from '@/hooks/queryKeys';
import {
  addProduct,
  deleteProduct,
  fetchProductVersions,
  fetchProducts,
  removeProductCostPrice,
  updateProduct,
} from '@/services/productService';

export interface UseProductsResult {
  products: Product[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useProducts = (): UseProductsResult => {
  const { currentUser } = useAuth();
  const query = useQuery({
    queryKey: qk.products.all,
    queryFn: fetchProducts,
    enabled: !!currentUser,
  });
  return {
    products: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: () => void query.refetch(),
  };
};

export interface UpdateProductArgs {
  id: string;
  data: Partial<Product>;
}

export interface UseProductMutationsResult {
  addProduct: (data: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (args: UpdateProductArgs) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  removeCostPrice: (id: string) => Promise<void>;
}

export const useProductMutations = (): UseProductMutationsResult => {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.products.all });

  const addMutation = useMutation({
    mutationFn: (data: Omit<Product, 'id'>) => addProduct(data),
    onSuccess: invalidate,
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: UpdateProductArgs) => updateProduct(id, data),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: invalidate,
  });
  const removeCostPriceMutation = useMutation({
    mutationFn: (id: string) => removeProductCostPrice(id),
    onSuccess: invalidate,
  });

  return {
    addProduct: (data) => addMutation.mutateAsync(data),
    updateProduct: (args) => updateMutation.mutateAsync(args),
    deleteProduct: (id) => deleteMutation.mutateAsync(id),
    removeCostPrice: (id) => removeCostPriceMutation.mutateAsync(id),
  };
};

export interface UseProductVersionsResult {
  versions: ProductVersion[];
  loading: boolean;
  error: Error | null;
}

export const useProductVersions = (
  productId: string | undefined,
  enabled = true,
): UseProductVersionsResult => {
  const { currentUser } = useAuth();
  const query = useQuery({
    queryKey: qk.products.versions(productId ?? ''),
    queryFn: () => fetchProductVersions(productId as string),
    enabled: !!productId && !!currentUser && enabled,
  });
  return {
    versions: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
  };
};

/**
 * React Query hooks cho domain Categories (epic #58).
 *
 * - queryFn/mutationFn GỌI THẲNG categoryService — KHÔNG viết lại HTTP.
 * - Query `enabled: !!currentUser` (tránh chạy trước auth → 401).
 * - Sau khi lưu invalidate `qk.categories.all`.
 * - KHÔNG nuốt lỗi: caller bắt error để toast.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProductCategory } from '@/types/category';
import { useAuth } from '@/contexts/AuthContext';
import { qk } from '@/hooks/queryKeys';
import { fetchCategories, saveCategories } from '@/services/categoryService';

export interface UseCategoriesResult {
  categories: ProductCategory[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useCategories = (): UseCategoriesResult => {
  const { currentUser } = useAuth();
  const query = useQuery({
    queryKey: qk.categories.all,
    queryFn: fetchCategories,
    enabled: !!currentUser,
  });
  return {
    categories: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: () => void query.refetch(),
  };
};

export interface UseSaveCategoriesResult {
  saveCategories: (categories: ProductCategory[]) => Promise<void>;
  saving: boolean;
}

export const useSaveCategories = (): UseSaveCategoriesResult => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (categories: ProductCategory[]) => saveCategories(categories),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.categories.all }),
  });
  return {
    saveCategories: (categories) => mutation.mutateAsync(categories),
    saving: mutation.isPending,
  };
};
